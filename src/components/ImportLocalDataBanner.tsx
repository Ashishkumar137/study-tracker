import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, X } from 'lucide-react';
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
      const n = await importSessionsToDb(localSessions, user.id);
      setCount(n);
      setStatus('done');
      await refreshSessions();
      // Clear local storage sessions after import
      localStorage.removeItem('study_tracker_sessions');
      localStorage.removeItem('study_tracker_active_session');
      setTimeout(() => {
        localStorage.setItem('study_tracker_import_dismissed', '1');
        setDismissed(true);
      }, 3000);
    } catch {
      setStatus('error');
    }
  };

  const dismiss = () => {
    localStorage.setItem('study_tracker_import_dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl border p-4 flex items-start gap-3 mb-4"
      style={{ background: '#DBEAFE', borderColor: '#BFDBFE' }}>
      <Upload size={18} className="shrink-0 mt-0.5" style={{ color: '#2563EB' }} />
      <div className="flex-1 min-w-0">
        {status === 'idle' && (
          <>
            <p className="text-sm font-semibold" style={{ color: '#1E40AF' }}>
              {localSessions.length} local session{localSessions.length > 1 ? 's' : ''} found
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#3B82F6' }}>
              Import your offline data into the cloud so it's saved permanently.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleImport}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: '#2563EB', color: '#fff' }}
              >
                Import to Cloud
              </button>
              <button
                onClick={dismiss}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: '#fff', color: '#2563EB', border: '1px solid #BFDBFE' }}
              >
                Dismiss
              </button>
            </div>
          </>
        )}
        {status === 'loading' && (
          <p className="text-sm" style={{ color: '#1E40AF' }}>Importing…</p>
        )}
        {status === 'done' && (
          <div className="flex items-center gap-2" style={{ color: '#16A34A' }}>
            <CheckCircle2 size={15} />
            <p className="text-sm font-semibold">{count} session{count !== 1 ? 's' : ''} imported successfully!</p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2" style={{ color: '#DC2626' }}>
            <AlertTriangle size={15} />
            <p className="text-sm">Import failed. Please try again.</p>
          </div>
        )}
      </div>
      <button onClick={dismiss} className="shrink-0" style={{ color: '#93c5fd' }}>
        <X size={16} />
      </button>
    </div>
  );
}
