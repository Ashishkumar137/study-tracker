import React, { useState } from 'react';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../AppContext';
import { useAuth } from '../AuthContext';
import { exportAsCSV, exportAsJSON } from '../storage';

function ClearConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-2xl shadow-xl p-6 max-w-sm mx-4 w-full border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={22} className="shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
          <div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-main)' }}>Clear All Data?</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              This will permanently delete all your study sessions. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DataControls() {
  const { sessions, clearAllSessions } = useApp();
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  const completed = sessions.filter(s => s.status === 'completed');

  return (
    <>
      {showConfirm && (
        <ClearConfirmDialog
          onConfirm={() => { clearAllSessions(); setShowConfirm(false); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-main)' }}>Data & Export</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportAsCSV(completed)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => exportAsJSON(completed)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <Download size={14} />
            Export JSON
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ml-auto"
            style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#EF4444' }}
          >
            <Trash2 size={14} />
            Clear All Data
          </button>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          {completed.length} completed session{completed.length !== 1 ? 's' : ''} ·{' '}
          {user ? '☁ Automatically saved to Supabase cloud' : '💾 Saved to localStorage (log in for cloud sync)'}
        </p>
      </div>
    </>
  );
}
