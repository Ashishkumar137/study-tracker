import React, { useState } from 'react';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../AppContext';
import { exportAsCSV, exportAsJSON } from '../storage';

function ClearConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4 w-full">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={22} className="text-rose-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-gray-900 font-semibold mb-1">Clear All Data?</p>
            <p className="text-gray-500 text-sm">This will permanently delete all your study sessions. This action cannot be undone. Consider exporting first.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700">Clear All Data</button>
        </div>
      </div>
    </div>
  );
}

export default function DataControls() {
  const { sessions, clearAllSessions } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      {showConfirm && (
        <ClearConfirmDialog
          onConfirm={() => { clearAllSessions(); setShowConfirm(false); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Data & Export</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportAsCSV(sessions.filter(s => s.status === 'completed'))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            onClick={() => exportAsJSON(sessions.filter(s => s.status === 'completed'))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Download size={15} />
            Export JSON
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-200 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors ml-auto"
          >
            <Trash2 size={15} />
            Clear All Data
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {sessions.filter(s => s.status === 'completed').length} completed sessions stored locally in your browser.
        </p>
      </div>
    </>
  );
}
