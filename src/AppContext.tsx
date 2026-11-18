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
  calcPausedMs, calcProductiveMsLive,
  msToHours, generateId, todayStr,
} from './storage';
import { fetchSessions, upsertSessionDb, deleteSessionDb } from './db';
import { useAuth } from './AuthContext';

interface AppContextValue {
  sessions: StudySession[];
  activeSession: ActiveSessionState | null;
  todayProductiveMs: number;
  loading: boolean;
  error: string | null;
  punchIn: (subject: Subject) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  punchOut: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  updateSession: (session: StudySession) => Promise<void>;
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
  const [, setTick] = useState(0);

  // Tick every second for live timer
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ─── Load sessions ────────────────────────────────────────────────────────
  const refreshSessions = useCallback(async () => {
    if (!user) {
      // Not logged in — use localStorage only
      setSessions(loadLocalSessions());
      setActiveSession(loadLocalActive());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dbSessions = await fetchSessions();
      setSessions(dbSessions);

      // Restore active session from DB (find any session with status active/paused)
      const liveSession = dbSessions.find(s => s.status === 'active' || s.status === 'paused');
      if (liveSession) {
        setActiveSession({
          sessionId: liveSession.id,
          subject: liveSession.subject,
          startTime: liveSession.startTime,
          pauses: liveSession.pauses,
          status: liveSession.status as 'active' | 'paused',
        });
      } else {
        setActiveSession(null);
      }
    } catch (e: unknown) {
      setError('Failed to load sessions. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Reload when auth state changes
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // If not logged in, persist to localStorage
  useEffect(() => {
    if (!user) {
      saveLocalSessions(sessions);
    }
  }, [sessions, user]);

  useEffect(() => {
    if (!user) {
      if (activeSession) saveLocalActive(activeSession);
      else clearLocalActive();
    }
  }, [activeSession, user]);

  // ─── Live productive ms ───────────────────────────────────────────────────
  const todayProductiveMs = (() => {
    const today = todayStr();
    const completedMs = sessions
      .filter(s => s.date === today && s.status === 'completed')
      .reduce((acc, s) => acc + s.productiveDurationMs, 0);
    const liveMs = activeSession
      ? calcProductiveMsLive(activeSession.startTime, activeSession.pauses, activeSession.status)
      : 0;
    return completedMs + liveMs;
  })();

  const targetReachedToday = msToHours(todayProductiveMs) >= DAILY_TARGET_HOURS;

  // ─── Helper: save session (DB or local) ──────────────────────────────────
  const saveSession = useCallback(async (session: StudySession) => {
    if (user) {
      await upsertSessionDb(session, user.id);
    }
    // Always keep local state in sync
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === session.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = session;
        return copy;
      }
      return [...prev, session];
    });
  }, [user]);

  // ─── Punch In ─────────────────────────────────────────────────────────────
  const punchIn = useCallback(async (subject: Subject) => {
    if (activeSession) return;

    const id = generateId();
    const now = new Date().toISOString();
    const today = todayStr();

    const newActive: ActiveSessionState = {
      sessionId: id, subject, startTime: now, pauses: [], status: 'active',
    };

    const skeletonSession: StudySession = {
      id, date: today, subject, startTime: now, pauses: [],
      status: 'active', productiveDurationMs: 0,
    };

    setActiveSession(newActive);
    await saveSession(skeletonSession);
  }, [activeSession, saveSession]);

  // ─── Pause ────────────────────────────────────────────────────────────────
  const pause = useCallback(async () => {
    if (!activeSession || activeSession.status !== 'active') return;
    const now = new Date().toISOString();
    const updatedPauses = [...activeSession.pauses, { pausedAt: now }];
    const updated: ActiveSessionState = { ...activeSession, status: 'paused', pauses: updatedPauses };
    setActiveSession(updated);

    const session = sessions.find(s => s.id === activeSession.sessionId);
    if (session) {
      await saveSession({ ...session, pauses: updatedPauses, status: 'paused' });
    }
  }, [activeSession, sessions, saveSession]);

  // ─── Resume ───────────────────────────────────────────────────────────────
  const resume = useCallback(async () => {
    if (!activeSession || activeSession.status !== 'paused') return;
    const now = new Date().toISOString();
    const updatedPauses = activeSession.pauses.map((p, i) =>
      i === activeSession.pauses.length - 1 && !p.resumedAt ? { ...p, resumedAt: now } : p
    );
    const updated: ActiveSessionState = { ...activeSession, status: 'active', pauses: updatedPauses };
    setActiveSession(updated);

    const session = sessions.find(s => s.id === activeSession.sessionId);
    if (session) {
      await saveSession({ ...session, pauses: updatedPauses, status: 'active' });
    }
  }, [activeSession, sessions, saveSession]);

  // ─── Punch Out ────────────────────────────────────────────────────────────
  const punchOut = useCallback(async () => {
    if (!activeSession) return;
    const now = new Date().toISOString();

    let finalPauses = [...activeSession.pauses];
    if (activeSession.status === 'paused') {
      finalPauses = finalPauses.map((p, i) =>
        i === finalPauses.length - 1 && !p.resumedAt ? { ...p, resumedAt: now } : p
      );
    }

    const totalMs = new Date(now).getTime() - new Date(activeSession.startTime).getTime();
    const pausedMs = calcPausedMs(finalPauses);
    const productiveDurationMs = Math.max(0, totalMs - pausedMs);

    const completedSession: StudySession = {
      id: activeSession.sessionId,
      date: activeSession.startTime.slice(0, 10),
      subject: activeSession.subject,
      startTime: activeSession.startTime,
      endTime: now,
      pauses: finalPauses,
      status: 'completed',
      productiveDurationMs,
    };

    setActiveSession(null);
    await saveSession(completedSession);
  }, [activeSession, saveSession]);

  // ─── Delete session ───────────────────────────────────────────────────────
  const deleteSession = useCallback(async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession?.sessionId === id) setActiveSession(null);
    if (user) await deleteSessionDb(id);
  }, [activeSession, user]);

  // ─── Update session ───────────────────────────────────────────────────────
  const updateSession = useCallback(async (session: StudySession) => {
    await saveSession(session);
  }, [saveSession]);

  // ─── Clear all ────────────────────────────────────────────────────────────
  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setActiveSession(null);
    if (!user) {
      localStorage.removeItem('study_tracker_sessions');
      localStorage.removeItem('study_tracker_active_session');
    }
  }, [user]);

  return (
    <AppContext.Provider value={{
      sessions, activeSession, todayProductiveMs,
      loading, error,
      punchIn, pause, resume, punchOut,
      deleteSession, updateSession, clearAllSessions,
      targetReachedToday, refreshSessions,
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
