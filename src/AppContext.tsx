import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef
} from 'react';
import { StudySession, ActiveSessionState, Subject, DAILY_TARGET_HOURS } from './types';
import {
  loadSessions as loadLocalSessions,
  saveSessions as saveLocalSessions,
  loadActiveSession as loadLocalActive,
  saveActiveSession as saveLocalActive,
  clearActiveSession as clearLocalActive,
  calcPausedMs, calcDayProductiveMs,
  msToHours, generateId, todayStr, dateStr,
  MAX_SESSION_DURATION_MS,
} from './storage';
import {
  fetchSessions, upsertSessionDb, deleteSessionDb, importSessionsToDb,
  dbToSession, DbSession, closeAllActiveSessionsDb
} from './db';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface AppContextValue {
  sessions: StudySession[];
  activeSession: ActiveSessionState | null;
  todayProductiveMs: number;
  loading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  punchIn: (subject: Subject) => Promise<boolean>;
  pause: () => Promise<boolean>;
  resume: () => Promise<boolean>;
  punchOut: () => Promise<boolean>;
  deleteSession: (id: string) => Promise<boolean>;
  updateSession: (session: StudySession) => Promise<boolean>;
  addManualSession: (session: StudySession) => Promise<boolean>;
  clearAllSessions: () => void;
  targetReachedToday: boolean;
  refreshSessions: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const [, setTick] = useState(0);

  // Tick every second to drive live timers & midnight updates
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ─── Fetch Ground Truth from Cloud (Safe Non-Destructive Merge) ──────────────
  const refreshSessions = useCallback(async () => {
    if (!user) {
      // Offline / guest mode (uses localStorage)
      setSessions(loadLocalSessions());
      setActiveSession(loadLocalActive());
      setLoading(false);
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    setError(null);
    try {
      const { sessions: dbSessions, error: fetchErr } = await fetchSessions();
      if (fetchErr) {
        setError(`Failed to load sessions: ${fetchErr}`);
        setSyncStatus('error');
        // Fallback to local cache if cloud load failed
        const local = loadLocalSessions();
        if (local.length > 0) setSessions(local);
        const localActive = loadLocalActive();
        if (localActive) setActiveSession(localActive);
      } else {
        // Safe Merge: Never wipe local sessions if DB returned fewer/empty
        const local = loadLocalSessions();
        const unsavedLocal = local.filter(l => !dbSessions.some(db => db.id === l.id));

        let mergedSessions = dbSessions;
        if (unsavedLocal.length > 0) {
          mergedSessions = [...unsavedLocal, ...dbSessions];
          // Auto-migrate unsaved local sessions to cloud so nothing is lost!
          importSessionsToDb(unsavedLocal, user.id).catch(console.error);
        }

        // ── Auto-repair & sanitize any runaway/corrupted sessions from the past ──
        let didSanitize = false;
        const sanitizedSessions = mergedSessions.map(s => {
          if (s.status === 'completed' && s.startTime && s.endTime) {
            const spanMs = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
            // Detect runaway sessions (>12 hours productive or multi-day span)
            if (s.productiveDurationMs > MAX_SESSION_DURATION_MS || spanMs > 24 * 3600 * 1000) {
              didSanitize = true;
              // Cleanly cap to a realistic 2.5 hour study session on its start date
              const realisticMs = 2.5 * 3600 * 1000;
              const cappedEnd = new Date(new Date(s.startTime).getTime() + realisticMs).toISOString();
              const fixed: StudySession = {
                ...s,
                endTime: cappedEnd,
                productiveDurationMs: realisticMs,
                pauses: [],
              };
              if (user) upsertSessionDb(fixed, user.id).catch(console.error);
              return fixed;
            }
          }
          return s;
        });

        if (didSanitize) {
          mergedSessions = sanitizedSessions;
        }

        setSessions(mergedSessions);
        saveLocalSessions(mergedSessions); // keep cache fresh

        // ── Single Active Session Enforcement & Ghost Timer Protection ───────────
        const allLiveSessions = mergedSessions
          .filter(s => s.status === 'active' || s.status === 'paused')
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        if (allLiveSessions.length > 0) {
          const newestLive = allLiveSessions[0];
          const ageMs = Date.now() - new Date(newestLive.startTime).getTime();

          // Close any secondary ghost active sessions in DB
          if (allLiveSessions.length > 1 && user) {
            closeAllActiveSessionsDb(user.id, newestLive.id).catch(console.error);
          }

          // If session was left open for over 16 hours (e.g. overnight or forgotten), auto-complete it!
          if (ageMs > 16 * 3600 * 1000) {
            const cappedDuration = 2 * 3600 * 1000; // 2h default
            const autoEnded: StudySession = {
              ...newestLive,
              status: 'completed',
              endTime: new Date(new Date(newestLive.startTime).getTime() + cappedDuration).toISOString(),
              productiveDurationMs: cappedDuration,
            };
            if (user) upsertSessionDb(autoEnded, user.id).catch(console.error);
            setActiveSession(null);
            clearLocalActive();
          } else {
            const liveState: ActiveSessionState = {
              sessionId: newestLive.id,
              subject: newestLive.subject,
              startTime: newestLive.startTime,
              pauses: newestLive.pauses,
              status: newestLive.status as 'active' | 'paused',
            };
            setActiveSession(liveState);
            saveLocalActive(liveState);
          }
        } else {
          setActiveSession(null);
          clearLocalActive();
        }

        setSyncStatus('synced');
      }
    } catch (e: any) {
      setError(e?.message || 'Connection error');
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load when user changes
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // ─── Supabase Realtime Subscription (Cross-Device Live Sync) ─────────────────
  useEffect(() => {
    if (!user) return;

    const channelName = `study_sessions_${user.id}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setSyncStatus('syncing');

          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as DbSession;
            if (!newRow || !newRow.id) return;
            const newSession = dbToSession(newRow);

            setSessions(prev => {
              if (prev.some(s => s.id === newSession.id)) {
                return prev.map(s => s.id === newSession.id ? newSession : s);
              }
              const updated = [newSession, ...prev];
              saveLocalSessions(updated);
              return updated;
            });

            if (newSession.status === 'active' || newSession.status === 'paused') {
              const liveState: ActiveSessionState = {
                sessionId: newSession.id,
                subject: newSession.subject,
                startTime: newSession.startTime,
                pauses: newSession.pauses,
                status: newSession.status as 'active' | 'paused',
              };
              setActiveSession(liveState);
              saveLocalActive(liveState);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as DbSession;
            if (!updatedRow || !updatedRow.id) return;
            const updated = dbToSession(updatedRow);

            setSessions(prev => {
              const next = prev.map(s => s.id === updated.id ? updated : s);
              saveLocalSessions(next);
              return next;
            });

            if (updated.status === 'completed') {
              setActiveSession(curr => {
                if (curr?.sessionId === updated.id) {
                  clearLocalActive();
                  return null;
                }
                return curr;
              });
            } else if (updated.status === 'active' || updated.status === 'paused') {
              const liveState: ActiveSessionState = {
                sessionId: updated.id,
                subject: updated.subject,
                startTime: updated.startTime,
                pauses: updated.pauses,
                status: updated.status as 'active' | 'paused',
              };
              setActiveSession(liveState);
              saveLocalActive(liveState);
            }
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as { id?: string };
            const deletedId = oldRow?.id;
            if (deletedId) {
              setSessions(prev => {
                const next = prev.filter(s => s.id !== deletedId);
                saveLocalSessions(next);
                return next;
              });
              setActiveSession(curr => {
                if (curr?.sessionId === deletedId) {
                  clearLocalActive();
                  return null;
                }
                return curr;
              });
            }
          }

          setSyncStatus('synced');
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setSyncStatus('synced');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.warn('Realtime channel error:', err);
          setSyncStatus('error');
        } else if (status === 'CLOSED') {
          setSyncStatus('offline');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ─── Network Online/Offline & Focus Reconnect ───────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('syncing');
      refreshSessions();
    };
    const handleOffline = () => {
      setSyncStatus('offline');
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user) {
        refreshSessions();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, refreshSessions]);

  // ─── Live Productive Ms (Timestamp based, midnight-crossing safe) ───────────
  const today = todayStr();
  const todayProductiveMs = calcDayProductiveMs(sessions, activeSession, today);
  const targetReachedToday = msToHours(todayProductiveMs) >= DAILY_TARGET_HOURS;

  // ─── Punch In ─────────────────────────────────────────────────────────────
  const punchIn = useCallback(async (subject: Subject): Promise<boolean> => {
    if (activeSession) {
      setError('A study session is already active. End or pause it before starting another.');
      return false;
    }

    const id = generateId();
    const now = new Date().toISOString();
    const sessionDate = dateStr(new Date(now));

    const newActive: ActiveSessionState = {
      sessionId: id,
      subject,
      startTime: now,
      pauses: [],
      status: 'active',
    };

    const skeletonSession: StudySession = {
      id,
      date: sessionDate,
      subject,
      startTime: now,
      pauses: [],
      status: 'active',
      productiveDurationMs: 0,
    };

    setActiveSession(newActive);
    setSessions(prev => [skeletonSession, ...prev]);
    saveLocalActive(newActive);

    if (user) {
      setSyncStatus('syncing');
      // Ensure any previous unclosed/ghost sessions in DB are completed first
      await closeAllActiveSessionsDb(user.id);
      const { success, error: err } = await upsertSessionDb(skeletonSession, user.id);
      if (!success) {
        setError(`Failed to save punch in to cloud: ${err}`);
        setSyncStatus('error');
        return false;
      }
      setSyncStatus('synced');
    }

    return true;
  }, [activeSession, user]);

  // ─── Pause ────────────────────────────────────────────────────────────────
  const pause = useCallback(async (): Promise<boolean> => {
    if (!activeSession || activeSession.status !== 'active') return false;

    const now = new Date().toISOString();
    const updatedPauses = [...activeSession.pauses, { pausedAt: now }];
    const updatedState: ActiveSessionState = {
      ...activeSession,
      status: 'paused',
      pauses: updatedPauses,
    };

    setActiveSession(updatedState);
    saveLocalActive(updatedState);

    const existing = sessions.find(s => s.id === activeSession.sessionId);
    const updatedSession: StudySession = existing
      ? { ...existing, pauses: updatedPauses, status: 'paused' }
      : {
          id: activeSession.sessionId,
          date: dateStr(new Date(activeSession.startTime)),
          subject: activeSession.subject,
          startTime: activeSession.startTime,
          pauses: updatedPauses,
          status: 'paused',
          productiveDurationMs: 0,
        };

    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));

    if (user) {
      setSyncStatus('syncing');
      const { success, error: err } = await upsertSessionDb(updatedSession, user.id);
      if (!success) {
        setError(`Failed to save pause to cloud: ${err}`);
        setSyncStatus('error');
        return false;
      }
      setSyncStatus('synced');
    }

    return true;
  }, [activeSession, sessions, user]);

  // ─── Resume ───────────────────────────────────────────────────────────────
  const resume = useCallback(async (): Promise<boolean> => {
    if (!activeSession || activeSession.status !== 'paused') return false;

    const now = new Date().toISOString();
    const updatedPauses = activeSession.pauses.map((p, i) =>
      i === activeSession.pauses.length - 1 && !p.resumedAt
        ? { ...p, resumedAt: now }
        : p
    );

    const updatedState: ActiveSessionState = {
      ...activeSession,
      status: 'active',
      pauses: updatedPauses,
    };

    setActiveSession(updatedState);
    saveLocalActive(updatedState);

    const existing = sessions.find(s => s.id === activeSession.sessionId);
    const updatedSession: StudySession = existing
      ? { ...existing, pauses: updatedPauses, status: 'active' }
      : {
          id: activeSession.sessionId,
          date: dateStr(new Date(activeSession.startTime)),
          subject: activeSession.subject,
          startTime: activeSession.startTime,
          pauses: updatedPauses,
          status: 'active',
          productiveDurationMs: 0,
        };

    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));

    if (user) {
      setSyncStatus('syncing');
      const { success, error: err } = await upsertSessionDb(updatedSession, user.id);
      if (!success) {
        setError(`Failed to save resume to cloud: ${err}`);
        setSyncStatus('error');
        return false;
      }
      setSyncStatus('synced');
    }

    return true;
  }, [activeSession, sessions, user]);

  // ─── Punch Out ────────────────────────────────────────────────────────────
  const punchOut = useCallback(async (): Promise<boolean> => {
    if (!activeSession) return false;

    const now = new Date().toISOString();

    let finalPauses = [...activeSession.pauses];
    if (activeSession.status === 'paused') {
      finalPauses = finalPauses.map((p, i) =>
        i === finalPauses.length - 1 && !p.resumedAt
          ? { ...p, resumedAt: now }
          : p
      );
    }

    const totalMs = new Date(now).getTime() - new Date(activeSession.startTime).getTime();
    const pausedMs = calcPausedMs(finalPauses, new Date(now).getTime());
    // Cap at MAX_SESSION_DURATION_MS to prevent runaway multi-day recordings
    const productiveDurationMs = Math.min(MAX_SESSION_DURATION_MS, Math.max(0, totalMs - pausedMs));

    const completedSession: StudySession = {
      id: activeSession.sessionId,
      date: dateStr(new Date(activeSession.startTime)),
      subject: activeSession.subject,
      startTime: activeSession.startTime,
      endTime: now,
      pauses: finalPauses,
      status: 'completed',
      productiveDurationMs,
    };

    setActiveSession(null);
    clearLocalActive();
    setSessions(prev => {
      const exists = prev.some(s => s.id === completedSession.id);
      const next = exists
        ? prev.map(s => s.id === completedSession.id ? completedSession : s)
        : [completedSession, ...prev];
      saveLocalSessions(next);
      return next;
    });

    if (user) {
      setSyncStatus('syncing');
      const { success, error: err } = await upsertSessionDb(completedSession, user.id);
      // Guarantee any other active sessions in DB are closed as well
      closeAllActiveSessionsDb(user.id, completedSession.id).catch(console.error);
      if (!success) {
        setError(`Failed to save punch out to cloud: ${err}`);
        setSyncStatus('error');
        return false;
      }
      setSyncStatus('synced');
    }

    return true;
  }, [activeSession, sessions, user]);

  // ─── Add Manual Session (Correction option) ───────────────────────────────
  const addManualSession = useCallback(async (session: StudySession): Promise<boolean> => {
    setSessions(prev => {
      const next = [session, ...prev];
      saveLocalSessions(next);
      return next;
    });

    if (user) {
      setSyncStatus('syncing');
      const { success, error: err } = await upsertSessionDb(session, user.id);
      if (!success) {
        setError(`Failed to save session to cloud: ${err}`);
        setSyncStatus('error');
        return false;
      }
      setSyncStatus('synced');
    }

    return true;
  }, [user]);

  // ─── Delete Session ───────────────────────────────────────────────────────
  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      saveLocalSessions(next);
      return next;
    });

    if (activeSession?.sessionId === id) {
      setActiveSession(null);
      clearLocalActive();
    }

    if (user) {
      setSyncStatus('syncing');
      const { success, error: err } = await deleteSessionDb(id);
      if (!success) {
        setError(`Failed to delete session: ${err}`);
        setSyncStatus('error');
        return false;
      }
      setSyncStatus('synced');
    }

    return true;
  }, [activeSession, user]);

  // ─── Update Session ───────────────────────────────────────────────────────
  const updateSession = useCallback(async (session: StudySession): Promise<boolean> => {
    setSessions(prev => {
      const next = prev.map(s => s.id === session.id ? session : s);
      saveLocalSessions(next);
      return next;
    });

    if (user) {
      setSyncStatus('syncing');
      const { success, error: err } = await upsertSessionDb(session, user.id);
      if (!success) {
        setError(`Failed to update session: ${err}`);
        setSyncStatus('error');
        return false;
      }
      setSyncStatus('synced');
    }

    return true;
  }, [user]);

  // ─── Clear All ────────────────────────────────────────────────────────────
  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setActiveSession(null);
    clearLocalActive();
    localStorage.removeItem('study_tracker_sessions');
  }, []);

  return (
    <AppContext.Provider value={{
      sessions,
      activeSession,
      todayProductiveMs,
      loading,
      error,
      syncStatus,
      punchIn,
      pause,
      resume,
      punchOut,
      deleteSession,
      updateSession,
      addManualSession,
      clearAllSessions,
      targetReachedToday,
      refreshSessions,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
