import { supabase } from './supabaseClient';
import { StudySession, Subject, PauseRecord } from './types';

// ─── DB row shape ─────────────────────────────────────────────────────────────
export interface DbSession {
  id: string;
  user_id: string;
  date: string;
  subject: string;
  start_time: string;
  end_time: string | null;
  pauses: PauseRecord[];
  status: string;
  productive_duration_ms: number;
  created_at?: string;
  updated_at?: string;
}

export function dbToSession(row: DbSession): StudySession {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    subject: row.subject as Subject,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    pauses: Array.isArray(row.pauses) ? row.pauses : [],
    status: row.status as StudySession['status'],
    productiveDurationMs: Number(row.productive_duration_ms) || 0,
  };
}

export function sessionToDb(s: StudySession, userId: string): Omit<DbSession, 'created_at' | 'updated_at'> {
  return {
    id: s.id,
    user_id: userId,
    date: s.date,
    subject: s.subject,
    start_time: s.startTime,
    end_time: s.endTime ?? null,
    pauses: Array.isArray(s.pauses) ? s.pauses : [],
    status: s.status,
    productive_duration_ms: Number(s.productiveDurationMs) || 0,
  };
}

// ─── Fetch all sessions with retry ───────────────────────────────────────────
export async function fetchSessions(): Promise<{ sessions: StudySession[]; error: string | null }> {
  let retries = 2;
  while (retries >= 0) {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) {
        if (retries === 0) return { sessions: [], error: error.message };
      } else {
        return { sessions: (data as DbSession[]).map(dbToSession), error: null };
      }
    } catch (e: any) {
      if (retries === 0) return { sessions: [], error: e?.message || 'Network error' };
    }
    retries--;
    await new Promise(r => setTimeout(r, 800));
  }
  return { sessions: [], error: 'Failed after retries' };
}

// ─── Upsert a single session ──────────────────────────────────────────────────
export async function upsertSessionDb(session: StudySession, userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const row = sessionToDb(session, userId);
    const { error } = await supabase
      .from('study_sessions')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('upsertSessionDb error:', error);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (e: any) {
    console.error('upsertSessionDb exception:', e);
    return { success: false, error: e?.message || 'Network error' };
  }
}

// ─── Delete a session ─────────────────────────────────────────────────────────
export async function deleteSessionDb(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('study_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('deleteSessionDb error:', error);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (e: any) {
    console.error('deleteSessionDb exception:', e);
    return { success: false, error: e?.message || 'Network error' };
  }
}

// ─── Bulk import (for migrating localStorage data) ───────────────────────────
export async function importSessionsToDb(sessions: StudySession[], userId: string): Promise<{ count: number; error: string | null }> {
  if (sessions.length === 0) return { count: 0, error: null };

  try {
    const rows = sessions.map(s => sessionToDb(s, userId));
    const { data, error } = await supabase
      .from('study_sessions')
      .upsert(rows, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('importSessionsToDb error:', error);
      return { count: 0, error: error.message };
    }
    return { count: data?.length ?? 0, error: null };
  } catch (e: any) {
    console.error('importSessionsToDb exception:', e);
    return { count: 0, error: e?.message || 'Network error' };
  }
}
