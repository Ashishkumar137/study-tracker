import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  StudySession, ActiveSessionState, Subject, DAILY_TARGET_HOURS
} from './types';
import {
  loadSessions, saveSessions, loadActiveSession, saveActiveSession,
  clearActiveSession, upsertSession, deleteSession as deleteSessionFromStorage,
  calcPausedMs, calcProductiveMsLive, calcProductiveMsCompleted,
  msToHours, generateId, todayStr, getDailyProductiveMs
} from './storage';

interface AppContextValue {
  // Sessions
  sessions: StudySession[];
  activeSession: ActiveSessionState | null;
  // Live productive ms today (sums completed + live active)
  todayProductiveMs: number;
  // Controls
  punchIn: (subject: Subject) => void;
  pause: () => void;
  resume: () => void;
  punchOut: () => void;
  deleteSession: (id: string) => void;
  updateSession: (session: StudySession) => void;
  clearAllSessions: () => void;
  // Target achievement
  targetReachedToday: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<StudySession[]>(() => loadSessions());
  const [activeSession, setActiveSession] = useState<ActiveSessionState | null>(() => loadActiveSession());
  const [tick, setTick] = useState(0);
  const targetNotifiedRef = useRef(false);

  // Tick every second for live timer
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Sync sessions to localStorage whenever they change
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Sync active session to localStorage whenever it changes
  useEffect(() => {
    if (activeSession) saveActiveSession(activeSession);
    else clearActiveSession();
  }, [activeSession]);

  // Calculate today's productive ms (live)
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

  // Notify when target first reached
  useEffect(() => {
    if (targetReachedToday && !targetNotifiedRef.current) {
      targetNotifiedRef.current = true;
    } else if (!targetReachedToday) {
      targetNotifiedRef.current = false;
    }
  }, [targetReachedToday]);

  // ─── Long session warning (> 6 hours continuous without punch-out) ─────────
  // We track this separately via tick

  const punchIn = useCallback((subject: Subject) => {
    if (activeSession) return; // prevent duplicate

    const id = generateId();
    const now = new Date().toISOString();
    const today = todayStr();

    const newActive: ActiveSessionState = {
      sessionId: id,
      subject,
      startTime: now,
      pauses: [],
      status: 'active',
    };

    // Create a skeleton session in sessions list (will be updated on punch out)
    const skeletonSession: StudySession = {
      id,
      date: today,
      subject,
      startTime: now,
      pauses: [],
      status: 'active',
      productiveDurationMs: 0,
    };

    setSessions(prev => [...prev, skeletonSession]);
    setActiveSession(newActive);
  }, [activeSession]);

  const pause = useCallback(() => {
    if (!activeSession || activeSession.status !== 'active') return;
    const now = new Date().toISOString();
    const updated: ActiveSessionState = {
      ...activeSession,
      status: 'paused',
      pauses: [...activeSession.pauses, { pausedAt: now }],
    };
    setActiveSession(updated);
    // Also update skeleton session in list
    setSessions(prev => prev.map(s =>
      s.id === activeSession.sessionId
        ? { ...s, pauses: updated.pauses, status: 'paused' }
        : s
    ));
  }, [activeSession]);

  const resume = useCallback(() => {
    if (!activeSession || activeSession.status !== 'paused') return;
    const now = new Date().toISOString();
    const updatedPauses = activeSession.pauses.map((p, i) =>
      i === activeSession.pauses.length - 1 && !p.resumedAt
        ? { ...p, resumedAt: now }
        : p
    );
    const updated: ActiveSessionState = {
      ...activeSession,
      status: 'active',
      pauses: updatedPauses,
    };
    setActiveSession(updated);
    setSessions(prev => prev.map(s =>
      s.id === activeSession.sessionId
        ? { ...s, pauses: updatedPauses, status: 'active' }
        : s
    ));
  }, [activeSession]);

  const punchOut = useCallback(() => {
    if (!activeSession) return;

    const now = new Date().toISOString();
    // If currently paused, close the last pause
    let finalPauses = [...activeSession.pauses];
    if (activeSession.status === 'paused') {
      finalPauses = finalPauses.map((p, i) =>
        i === finalPauses.length - 1 && !p.resumedAt
          ? { ...p, resumedAt: now }
          : p
      );
    }

    const totalMs = new Date(now).getTime() - new Date(activeSession.startTime).getTime();
    const pausedMs = calcPausedMs(finalPauses);
    const productiveDurationMs = Math.max(0, totalMs - pausedMs);

    const completedSession: StudySession = {
      id: activeSession.sessionId,
      date: activeSession.startTime.slice(0, 10), // date from start (handle midnight correctly)
      subject: activeSession.subject,
      startTime: activeSession.startTime,
      endTime: now,
      pauses: finalPauses,
      status: 'completed',
      productiveDurationMs,
    };

    setSessions(prev => prev.map(s =>
      s.id === activeSession.sessionId ? completedSession : s
    ));
    setActiveSession(null);
  }, [activeSession]);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession?.sessionId === id) {
      setActiveSession(null);
    }
  }, [activeSession]);

  const updateSession = useCallback((session: StudySession) => {
    setSessions(prev => prev.map(s => s.id === session.id ? session : s));
  }, []);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setActiveSession(null);
  }, []);

  return (
    <AppContext.Provider value={{
      sessions,
      activeSession,
      todayProductiveMs,
      punchIn,
      pause,
      resume,
      punchOut,
      deleteSession,
      updateSession,
      clearAllSessions,
      targetReachedToday,
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
