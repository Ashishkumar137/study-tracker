import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { StudySession } from '../types';
import { loadSessions } from '../storage';
import { importSessionsToDb } from '../db';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';

export default function ImportLocalDataBanner() {
  const { user } = useAuth();
  const { refreshSessions } = useApp();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('study_tracker_import_dismissed') === '1'
  );

  if (!user || dismissed) return null;

  const localSessions: StudySession[] = loadSessions().filter(s => s.status === 'completed');
  if (localSessions.length === 0) return null;

  const handleImport = async () => {
    setStatus('loading');
    try {
      const { count: importedCount, error } = await importSessionsToDb(localSessions, user.id);
      if (error) {
        setStatus('error');
        return;
      }
      setCount(importedCount);
      setStatus('done');
      await refreshSessions();

      // Clear local storage sessions after successful cloud import
      localStorage.removeItem('study_tracker_sessions');
      localStorage.removeItem('study_tracker_active_session');

      setTimeout(() => {
        localStorage.setItem('study_tracker_import_dismissed', '1');
        setDismissed(true);
      }, 4000);
    } catch {
      setStatus('error');
    }
  };

  const dismiss = () => {
    localStorage.setItem('study_tracker_import_dismissed', '1');
    setDismissed(true);
  };

  return (
    <div
      className="rounded-2xl border p-4 flex items-start gap-3 mb-4 shadow-sm"
      style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#DBEAFE' }}>
        <Upload size={16} style={{ color: '#2563EB' }} />
      </div>
      <div className="flex-1 min-w-0">
        {status === 'idle' && (
          <>
            <p className="text-sm font-semibold" style={{ color: '#1E40AF' }}>
              {localSessions.length} local study session{localSessions.length > 1 ? 's' : ''} found on this device
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#3B82F6' }}>
              Migrate your offline records into Supabase so they are permanently saved and accessible from any device.
            </p>
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={handleImport}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all"
                style={{ background: '#DBEAFE', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#BFDBFE')}
                onMouseLeave={e => (e.currentTarget.style.background = '#DBEAFE')}
              >
                Import to Cloud Database
              </button>
              <button
                onClick={dismiss}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-all"
                style={{ background: '#FFFFFF', borderColor: '#BFDBFE', color: '#64748B' }}
              >
                Keep Local Only
              </button>
            </div>
          </>
        )}
        {status === 'loading' && (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#1E40AF' }}>
            <Loader2 size={15} className="animate-spin" />
            <span>Importing {localSessions.length} sessions to your cloud database...</span>
          </div>
        )}
        {status === 'done' && (
          <div className="flex items-center gap-2" style={{ color: '#16A34A' }}>
            <CheckCircle2 size={16} />
            <p className="text-sm font-semibold">
              {count} session{count !== 1 ? 's' : ''} migrated successfully! Your records are now synchronized across all devices.
            </p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2" style={{ color: '#DC2626' }}>
            <AlertTriangle size={16} />
            <p className="text-sm">Cloud migration failed. Please check your internet connection and try again.</p>
          </div>
        )}
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 p-1 rounded-lg hover:bg-black/5"
        style={{ color: '#93C5FD' }}
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
