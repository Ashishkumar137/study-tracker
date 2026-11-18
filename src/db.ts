import { supabase } from './supabaseClient';
import { StudySession, Subject, PauseRecord } from './types';

// ─── DB row shape ─────────────────────────────────────────────────────────────
interface DbSession {
  id: string;
  user_id: string;
  date: string;
  subject: string;
  start_time: string;
  end_time: string | null;
  pauses: PauseRecord[];
  status: string;
  productive_duration_ms: number;
}

function dbToSession(row: DbSession): StudySession {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    subject: row.subject as Subject,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    pauses: row.pauses ?? [],
    status: row.status as StudySession['status'],
    productiveDurationMs: row.productive_duration_ms,
  };
}

function sessionToDb(s: StudySession, userId: string): Omit<DbSession, 'user_id'> & { user_id: string } {
  return {
    id: s.id,
    user_id: userId,
    date: s.date,
    subject: s.subject,
    start_time: s.startTime,
    end_time: s.endTime ?? null,
    pauses: s.pauses,
    status: s.status,
    productive_duration_ms: s.productiveDurationMs,
  };
}

// ─── Load all sessions for the logged-in user ─────────────────────────────────
export async function fetchSessions(): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .order('start_time', { ascending: false });

  if (error) {
    console.error('fetchSessions error:', error);
    return [];
  }
  return (data as DbSession[]).map(dbToSession);
}

// ─── Upsert a single session ──────────────────────────────────────────────────
export async function upsertSessionDb(session: StudySession, userId: string): Promise<void> {
  const { error } = await supabase
    .from('study_sessions')
    .upsert(sessionToDb(session, userId), { onConflict: 'id' });

  if (error) console.error('upsertSessionDb error:', error);
}

// ─── Delete a session ─────────────────────────────────────────────────────────
export async function deleteSessionDb(id: string): Promise<void> {
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', id);

  if (error) console.error('deleteSessionDb error:', error);
}

// ─── Bulk import (for migrating localStorage data) ───────────────────────────
export async function importSessionsToDb(sessions: StudySession[], userId: string): Promise<number> {
  if (sessions.length === 0) return 0;

  const rows = sessions.map(s => sessionToDb(s, userId));
  const { data, error } = await supabase
    .from('study_sessions')
    .upsert(rows, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('importSessionsToDb error:', error);
    return 0;
  }
  return data?.length ?? 0;
}
