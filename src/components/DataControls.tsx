import React from 'react';
import { Download } from 'lucide-react';
import { useApp } from '../AppContext';
import { useAuth } from '../AuthContext';
import { exportAsCSV, exportAsJSON } from '../storage';

export default function DataControls() {
  const { sessions } = useApp();
  const { user } = useAuth();

  const completed = sessions.filter(s => s.status === 'completed');

  return (
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
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
        {completed.length} completed session{completed.length !== 1 ? 's' : ''} ·{' '}
        {user ? '☁ Automatically saved to Supabase cloud' : '💾 Saved to localStorage (log in for cloud sync)'}
      </p>
    </div>
  );
}
