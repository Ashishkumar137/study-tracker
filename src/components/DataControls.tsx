import React, { useState } from 'react';
import { Download, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useApp } from '../AppContext';
import { useAuth } from '../AuthContext';
import { exportAsCSV, exportAsJSON } from '../storage';

function ClearConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4 w-full border" style={{ borderColor: '#E2E8F0' }}>
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={22} className="shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
          <div>
            <p className="font-semibold mb-1" style={{ color: '#1E293B' }}>Clear All Data?</p>
            <p className="text-sm" style={{ color: '#64748B' }}>
              This will permanently delete all your study sessions. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
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
  const { sessions, clearAllSessions, refreshSessions } = useApp();
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const completed = sessions.filter(s => s.status === 'completed');

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSessions();
    setRefreshing(false);
  };

  return (
    <>
      {showConfirm && (
        <ClearConfirmDialog
          onConfirm={() => { clearAllSessions(); setShowConfirm(false); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: '#E2E8F0' }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: '#1E293B' }}>Data & Export</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportAsCSV(completed)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
            style={{ background: '#F8FAFC', borderColor: '#E2E8F0', color: '#1E293B' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F8FAFC')}
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => exportAsJSON(completed)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
            style={{ background: '#F8FAFC', borderColor: '#E2E8F0', color: '#1E293B' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F8FAFC')}
          >
            <Download size={14} />
            Export JSON
          </button>
          {user && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
              style={{ background: '#EFF6FF', borderColor: '#BFDBFE', color: '#2563EB' }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Syncing…' : 'Sync from Cloud'}
            </button>
          )}
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ml-auto"
            style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
            onMouseLeave={e => (e.currentTarget.style.background = '#FEF2F2')}
          >
            <Trash2 size={14} />
            Clear All Data
          </button>
        </div>
        <p className="text-xs mt-3" style={{ color: '#94a3b8' }}>
          {completed.length} completed session{completed.length !== 1 ? 's' : ''} ·{' '}
          {user ? '☁ Saved to Supabase cloud' : '💾 Saved to localStorage (log in for cloud sync)'}
        </p>
      </div>
    </>
  );
}
