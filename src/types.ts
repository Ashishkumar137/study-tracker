// Core Types for Study Tracker

export type Subject = 'Maths' | 'Reasoning' | 'English' | 'GS/GK';

export const SUBJECTS: Subject[] = ['Maths', 'Reasoning', 'English', 'GS/GK'];

export const DAILY_TARGET_HOURS = 10;

export type SessionStatus = 'active' | 'paused' | 'completed';

export interface PauseRecord {
  pausedAt: string;   // ISO timestamp
  resumedAt?: string; // ISO timestamp, undefined if still paused
}

export interface StudySession {
  id: string;
  date: string;        // YYYY-MM-DD
  subject: Subject;
  startTime: string;   // ISO timestamp
  endTime?: string;    // ISO timestamp, undefined if active
  pauses: PauseRecord[];
  status: SessionStatus;
  productiveDurationMs: number; // cached, recalculated on punch out
  userId?: string;     // set when synced with Supabase
}

export interface ActiveSessionState {
  sessionId: string;
  subject: Subject;
  startTime: string;
  pauses: PauseRecord[];
  status: 'active' | 'paused';
}

export type NavPage = 'dashboard' | 'analytics' | 'history';

export interface AuthUser {
  id: string;
  email: string;
}
