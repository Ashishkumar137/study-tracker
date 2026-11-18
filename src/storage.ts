import { StudySession, ActiveSessionState, PauseRecord } from './types';

const SESSIONS_KEY = 'study_tracker_sessions';
const ACTIVE_SESSION_KEY = 'study_tracker_active_session';

// ─── Sessions ───────────────────────────────────────────────────────────────

export function loadSessions(): StudySession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: StudySession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function upsertSession(session: StudySession): void {
  const all = loadSessions();
  const idx = all.findIndex(s => s.id === session.id);
  if (idx >= 0) all[idx] = session;
  else all.push(session);
  saveSessions(all);
}

export function deleteSession(id: string): void {
  const all = loadSessions().filter(s => s.id !== id);
  saveSessions(all);
}

// ─── Active Session ──────────────────────────────────────────────────────────

export function loadActiveSession(): ActiveSessionState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(state: ActiveSessionState): void {
  localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(state));
}

export function clearActiveSession(): void {
  localStorage.removeItem(ACTIVE_SESSION_KEY);
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function exportAsJSON(sessions: StudySession[]): void {
  const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `study-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAsCSV(sessions: StudySession[]): void {
  const headers = ['Date', 'Subject', 'Punch In', 'Punch Out', 'Break Duration (min)', 'Productive Duration (min)', 'Status'];
  const rows = sessions.map(s => {
    const pausedMs = calcPausedMs(s.pauses);
    const prodMs = s.productiveDurationMs;
    return [
      s.date,
      s.subject,
      new Date(s.startTime).toLocaleTimeString(),
      s.endTime ? new Date(s.endTime).toLocaleTimeString() : '',
      Math.round(pausedMs / 60000),
      Math.round(prodMs / 60000),
      s.status,
    ];
  });
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `study-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function clearAllData(): void {
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem(ACTIVE_SESSION_KEY);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function calcPausedMs(pauses: PauseRecord[]): number {
  const now = Date.now();
  return pauses.reduce((acc, p) => {
    const start = new Date(p.pausedAt).getTime();
    const end = p.resumedAt ? new Date(p.resumedAt).getTime() : now;
    return acc + (end - start);
  }, 0);
}

export function calcProductiveMsLive(
  startTime: string,
  pauses: PauseRecord[],
  status: 'active' | 'paused'
): number {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const totalMs = now - start;
  const pausedMs = calcPausedMs(pauses);
  return Math.max(0, totalMs - pausedMs);
}

export function calcProductiveMsCompleted(session: StudySession): number {
  if (!session.endTime) return 0;
  const totalMs = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
  const pausedMs = calcPausedMs(session.pauses);
  return Math.max(0, totalMs - pausedMs);
}

export function msToHours(ms: number): number {
  return ms / 3600000;
}

export function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyProductiveMs(sessions: StudySession[], date: string): number {
  return sessions
    .filter(s => s.date === date && s.status === 'completed')
    .reduce((acc, s) => acc + s.productiveDurationMs, 0);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Get week start (Monday) for a given date
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
