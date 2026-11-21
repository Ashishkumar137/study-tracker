import { StudySession, ActiveSessionState, PauseRecord, Subject } from './types';

const SESSIONS_KEY = 'study_tracker_sessions';
const ACTIVE_SESSION_KEY = 'study_tracker_active_session';

// ─── Local date helpers (Timezone-safe) ────────────────────────────────────────

/**
 * Returns YYYY-MM-DD in local time (never UTC-shifted).
 */
export function dateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayStr(): string {
  return dateStr(new Date());
}

/**
 * Returns Monday at 00:00:00.000 for the week containing the given date in local time.
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Time calculation rules (Precise, timestamp-based, overlap-safe) ─────────

/**
 * Maximum continuous study time permitted for a single session (12 hours).
 * Prevents runaway timers if a user closes laptop or sleeps without punching out.
 */
export const MAX_SESSION_DURATION_MS = 12 * 3600 * 1000;

export function calcPausedMs(pauses: PauseRecord[], nowMs: number = Date.now()): number {
  return pauses.reduce((acc, p) => {
    const start = new Date(p.pausedAt).getTime();
    if (isNaN(start)) return acc;
    const end = p.resumedAt ? new Date(p.resumedAt).getTime() : nowMs;
    return acc + Math.max(0, end - start);
  }, 0);
}

export function calcProductiveMsLive(
  startTime: string,
  pauses: PauseRecord[],
  status: 'active' | 'paused',
  nowMs: number = Date.now()
): number {
  const start = new Date(startTime).getTime();
  if (isNaN(start) || start > nowMs) return 0;
  const totalMs = nowMs - start;
  const pausedMs = calcPausedMs(pauses, nowMs);
  const netMs = Math.max(0, totalMs - pausedMs);
  // Cap at MAX_SESSION_DURATION_MS to prevent runaway timers
  return Math.min(MAX_SESSION_DURATION_MS, netMs);
}

export function calcProductiveMsCompleted(session: StudySession): number {
  if (!session.endTime) return 0;
  const start = new Date(session.startTime).getTime();
  const end = new Date(session.endTime).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  const totalMs = end - start;
  const pausedMs = calcPausedMs(session.pauses, end);
  const netMs = Math.max(0, totalMs - pausedMs);
  return Math.min(MAX_SESSION_DURATION_MS, netMs);
}

/**
 * Merge overlapping time intervals so that concurrent/overlapping sessions
 * never double-count time.
 */
export function mergeIntervals(intervals: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  if (intervals.length <= 1) return intervals;
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = sorted[i];
    if (curr.start <= prev.end) {
      prev.end = Math.max(prev.end, curr.end);
    } else {
      merged.push({ ...curr });
    }
  }
  return merged;
}

/**
 * Given a session's start, end (or now), and pauses, extracts all productive intervals:
 * Array of [segmentStartMs, segmentEndMs].
 */
function getProductiveSegments(
  startTime: string,
  endTime: string | undefined,
  pauses: PauseRecord[],
  nowMs: number
): Array<{ start: number; end: number }> {
  const sStart = new Date(startTime).getTime();
  if (isNaN(sStart)) return [];
  const sEnd = endTime ? new Date(endTime).getTime() : nowMs;
  if (isNaN(sEnd) || sEnd <= sStart) return [];

  // Sort pauses chronologically
  const sortedPauses = [...pauses]
    .map(p => ({
      start: new Date(p.pausedAt).getTime(),
      end: p.resumedAt ? new Date(p.resumedAt).getTime() : nowMs,
    }))
    .filter(p => !isNaN(p.start) && p.start < sEnd)
    .sort((a, b) => a.start - b.start);

  const segments: Array<{ start: number; end: number }> = [];
  let cur = sStart;

  for (const p of sortedPauses) {
    const pauseStart = Math.max(cur, p.start);
    if (pauseStart > cur) {
      segments.push({ start: cur, end: Math.min(sEnd, pauseStart) });
    }
    cur = Math.max(cur, p.end);
    if (cur >= sEnd) break;
  }

  if (cur < sEnd) {
    segments.push({ start: cur, end: sEnd });
  }

  return segments;
}

/**
 * Calculates productive milliseconds for a specific calendar day (YYYY-MM-DD in local time).
 * Correctly clips sessions that cross midnight, eliminates overlapping session double-counting,
 * and guarantees a strict 24-hour daily ceiling.
 */
export function calcDayProductiveMs(
  sessions: StudySession[],
  activeSession: ActiveSessionState | null,
  targetDateStr: string,
  nowMs: number = Date.now()
): number {
  // Parse target date's local boundaries: 00:00:00.000 to 23:59:59.999
  const [y, m, d] = targetDateStr.split('-').map(Number);
  if (!y || !m || !d) return 0;

  const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999).getTime() + 1; // exclusive upper bound

  const rawIntervals: Array<{ start: number; end: number }> = [];

  // 1. Completed sessions
  for (const s of sessions) {
    if (s.status !== 'completed' || !s.startTime || !s.endTime) continue;
    const sStart = new Date(s.startTime).getTime();
    const sEnd = new Date(s.endTime).getTime();
    // Quick reject if no overlap with the day
    if (sEnd <= dayStart || sStart >= dayEnd) continue;

    const segments = getProductiveSegments(s.startTime, s.endTime, s.pauses, nowMs);
    for (const seg of segments) {
      const overlapStart = Math.max(seg.start, dayStart);
      const overlapEnd = Math.min(seg.end, dayEnd);
      if (overlapEnd > overlapStart) {
        rawIntervals.push({ start: overlapStart, end: overlapEnd });
      }
    }
  }

  // 2. Active session (if any)
  if (activeSession && activeSession.startTime) {
    const sStart = new Date(activeSession.startTime).getTime();
    if (sStart < dayEnd && nowMs > dayStart) {
      const segments = getProductiveSegments(activeSession.startTime, undefined, activeSession.pauses, nowMs);
      for (const seg of segments) {
        const overlapStart = Math.max(seg.start, dayStart);
        const overlapEnd = Math.min(seg.end, dayEnd);
        if (overlapEnd > overlapStart) {
          rawIntervals.push({ start: overlapStart, end: overlapEnd });
        }
      }
    }
  }

  // Merge intervals to completely eliminate duplicate or overlapping study time
  const merged = mergeIntervals(rawIntervals);
  const totalMs = merged.reduce((acc, seg) => acc + (seg.end - seg.start), 0);

  // Maximum 24 hours per calendar day (hard mathematical limit)
  return Math.min(24 * 3600 * 1000, Math.max(0, totalMs));
}

/**
 * Calculates productive milliseconds for a specific subject within a calendar day.
 */
export function calcSubjectDayProductiveMs(
  sessions: StudySession[],
  activeSession: ActiveSessionState | null,
  subject: Subject,
  targetDateStr: string,
  nowMs: number = Date.now()
): number {
  const filteredCompleted = sessions.filter(s => s.subject === subject);
  const matchedActive = activeSession && activeSession.subject === subject ? activeSession : null;
  return calcDayProductiveMs(filteredCompleted, matchedActive, targetDateStr, nowMs);
}

/**
 * Calculates total productive milliseconds for a subject across a set of dates or all-time.
 */
export function calcSubjectRangeProductiveMs(
  sessions: StudySession[],
  activeSession: ActiveSessionState | null,
  subject: Subject,
  dateFilter?: (dateStr: string) => boolean,
  nowMs: number = Date.now()
): number {
  let totalMs = 0;

  for (const s of sessions) {
    if (s.subject !== subject || s.status !== 'completed') continue;
    if (dateFilter && !dateFilter(s.date)) continue;
    // Cap corrupted past records to MAX_SESSION_DURATION_MS
    const validMs = Math.min(MAX_SESSION_DURATION_MS, Number(s.productiveDurationMs) || 0);
    totalMs += validMs;
  }

  if (activeSession && activeSession.subject === subject) {
    const activeDate = activeSession.startTime ? dateStr(new Date(activeSession.startTime)) : todayStr();
    if (!dateFilter || dateFilter(activeDate)) {
      totalMs += calcProductiveMsLive(activeSession.startTime, activeSession.pauses, activeSession.status, nowMs);
    }
  }

  return totalMs;
}

export function msToHours(ms: number): number {
  return ms / 3600000;
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatHours(hours: number): string {
  if (hours <= 0) return '0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// ─── LocalStorage Persistence (Offline / Fallback) ────────────────────────────

export function loadSessions(): StudySession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: StudySession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // quota exceeded or private mode
  }
}

export function loadActiveSession(): ActiveSessionState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(state: ActiveSessionState): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    // ignore
  }
}

// ─── Export functions ─────────────────────────────────────────────────────────

export function exportAsJSON(sessions: StudySession[]): void {
  const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `study-tracker-export-${todayStr()}.json`;
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
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `study-tracker-export-${todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
