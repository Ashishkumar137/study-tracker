import React, { useState } from 'react';
import {
  Trash2, Pencil, Filter, CheckCircle2, XCircle,
  AlertTriangle, ChevronDown, X
} from 'lucide-react';
import { useApp } from '../AppContext';
import { StudySession, Subject, SUBJECTS } from '../types';
import { formatDuration, calcPausedMs, msToHours } from '../storage';
import { subjectColor } from './SubjectSummaryTable';

function ConfirmDialog({
  message, onConfirm, onCancel
}: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4 w-full">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={22} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-gray-700 text-sm">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ session, onSave, onClose }: {
  session: StudySession;
  onSave: (s: StudySession) => void;
  onClose: () => void;
}) {
  const [startTime, setStartTime] = useState(toLocalInput(session.startTime));
  const [endTime, setEndTime] = useState(session.endTime ? toLocalInput(session.endTime) : '');
  const [subject, setSubject] = useState<Subject>(session.subject);
  const [error, setError] = useState('');

  function toLocalInput(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const handleSave = () => {
    if (!startTime || !endTime) { setError('Start and end time are required.'); return; }
    const st = new Date(startTime);
    const et = new Date(endTime);
    if (et <= st) { setError('End time must be after start time.'); return; }
    const totalMs = et.getTime() - st.getTime();
    const pausedMs = calcPausedMs(session.pauses);
    const productiveDurationMs = Math.max(0, totalMs - pausedMs);
    onSave({
      ...session,
      subject,
      startTime: st.toISOString(),
      endTime: et.toISOString(),
      date: st.toISOString().slice(0, 10),
      productiveDurationMs,
      status: 'completed',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-4 w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Edit Session</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value as Subject)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryTable() {
  const { sessions, deleteSession, updateSession } = useApp();
  const [filterSubject, setFilterSubject] = useState<Subject | 'All'>('All');
  const [filterDate, setFilterDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<StudySession | null>(null);

  const completed = sessions
    .filter(s => s.status === 'completed')
    .filter(s => filterSubject === 'All' || s.subject === filterSubject)
    .filter(s => !filterDate || s.date === filterDate)
    .sort((a, b) => b.startTime.localeCompare(a.startTime));

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      {deleteTarget && (
        <ConfirmDialog
          message="Delete this session? This action cannot be undone."
          onConfirm={() => { deleteSession(deleteTarget!); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {editTarget && (
        <EditModal
          session={editTarget}
          onSave={s => { updateSession(s); setEditTarget(null); }}
          onClose={() => setEditTarget(null)}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header + Filters */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 flex-1">Attendance History</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value as Subject | 'All')}
                className="appearance-none pl-3 pr-7 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="All">All Subjects</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {completed.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No sessions found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-4 py-3">Subject</th>
                  <th className="text-left px-4 py-3">Punch In</th>
                  <th className="text-left px-4 py-3">Punch Out</th>
                  <th className="text-right px-4 py-3">Break</th>
                  <th className="text-right px-4 py-3">Productive</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((s, i) => {
                  const breakMs = calcPausedMs(s.pauses);
                  return (
                    <tr key={s.id} className={`border-t border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
                      <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{fmtDate(s.date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${subjectColor(s.subject)}`} />
                          <span className="text-gray-700">{s.subject}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-700">{fmt(s.startTime)}</td>
                      <td className="px-4 py-3 tabular-nums text-gray-700">{s.endTime ? fmt(s.endTime) : '—'}</td>
                      <td className="px-4 py-3 tabular-nums text-right text-gray-500">{breakMs > 0 ? formatDuration(breakMs) : '—'}</td>
                      <td className="px-4 py-3 tabular-nums text-right font-medium text-gray-900">{formatDuration(s.productiveDurationMs)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
                          ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.status === 'completed' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditTarget(s)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Edit session"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(s.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                            title="Delete session"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {completed.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {completed.length} session{completed.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </>
  );
}
