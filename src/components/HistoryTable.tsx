import React, { useState } from 'react';
import {
  Trash2, Pencil, CheckCircle2, XCircle,
  AlertTriangle, ChevronDown, X, Plus
} from 'lucide-react';
import { useApp } from '../AppContext';
import { StudySession, Subject, SUBJECTS } from '../types';
import { formatDuration, calcPausedMs, dateStr, generateId } from '../storage';
import { subjectColor } from './SubjectSummaryTable';

function ConfirmDialog({
  message, onConfirm, onCancel
}: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="rounded-2xl shadow-xl p-6 max-w-sm mx-4 w-full border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={22} className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
          <p className="text-sm" style={{ color: 'var(--text-main)' }}>{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
            style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AddSessionModal({ onSave, onClose }: {
  onSave: (s: StudySession) => void;
  onClose: () => void;
}) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const defaultDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const defaultStart = `${defaultDate}T${pad(thirtyMinsAgo.getHours())}:${pad(thirtyMinsAgo.getMinutes())}`;
  const defaultEnd = `${defaultDate}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [subject, setSubject] = useState<Subject>('Maths');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!startTime || !endTime) {
      setError('Start time and end time are both required.');
      return;
    }
    const st = new Date(startTime);
    const et = new Date(endTime);
    if (isNaN(st.getTime()) || isNaN(et.getTime())) {
      setError('Invalid date/time format.');
      return;
    }
    if (et <= st) {
      setError('End time must be after start time.');
      return;
    }

    const totalMs = et.getTime() - st.getTime();
    const productiveDurationMs = Math.max(0, totalMs);

    onSave({
      id: generateId(),
      subject,
      startTime: st.toISOString(),
      endTime: et.toISOString(),
      date: dateStr(st),
      pauses: [],
      productiveDurationMs,
      status: 'completed',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="rounded-2xl shadow-xl p-6 max-w-md mx-4 w-full border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>Add Past Study Session</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value as Subject)}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
            >
              {SUBJECTS.map(s => (
                <option key={s} value={s} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Punch In Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Punch Out Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
            />
          </div>
          {error && (
            <p className="text-xs rounded-lg p-2" style={{ background: '#FEF2F2', color: '#DC2626' }}>
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
            style={{ background: 'var(--badge-bg)', borderColor: 'var(--badge-border)', color: 'var(--badge-text)' }}
          >
            Save Session to Cloud
          </button>
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
    if (!startTime || !endTime) {
      setError('Start and end time are both required.');
      return;
    }
    const st = new Date(startTime);
    const et = new Date(endTime);
    if (isNaN(st.getTime()) || isNaN(et.getTime())) {
      setError('Invalid date/time format.');
      return;
    }
    if (et <= st) {
      setError('End time must be after start time.');
      return;
    }

    const totalMs = et.getTime() - st.getTime();
    const pausedMs = calcPausedMs(session.pauses, et.getTime());
    const productiveDurationMs = Math.max(0, totalMs - pausedMs);

    onSave({
      ...session,
      subject,
      startTime: st.toISOString(),
      endTime: et.toISOString(),
      date: dateStr(st),
      productiveDurationMs,
      status: 'completed',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="rounded-2xl shadow-xl p-6 max-w-md mx-4 w-full border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>Edit Study Session</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value as Subject)}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
            >
              {SUBJECTS.map(s => (
                <option key={s} value={s} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Punch In Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Punch Out Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
            />
          </div>
          {error && (
            <p className="text-xs rounded-lg p-2" style={{ background: '#FEF2F2', color: '#DC2626' }}>
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
            style={{ background: 'var(--badge-bg)', borderColor: 'var(--badge-border)', color: 'var(--badge-text)' }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryTable() {
  const { sessions, deleteSession, updateSession, addManualSession } = useApp();
  const [filterSubject, setFilterSubject] = useState<Subject | 'All'>('All');
  const [filterDate, setFilterDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<StudySession | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const completed = sessions
    .filter(s => s.status === 'completed')
    .filter(s => filterSubject === 'All' || s.subject === filterSubject)
    .filter(s => !filterDate || s.date === filterDate)
    .sort((a, b) => b.startTime.localeCompare(a.startTime));

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const fmtDate = (dStr: string) => {
    const [y, m, d] = dStr.split('-').map(Number);
    if (!y || !m || !d) return dStr;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      {showAddModal && (
        <AddSessionModal
          onSave={s => addManualSession(s)}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message="Delete this session from your cloud records? This action cannot be undone."
          onConfirm={() => { deleteSession(deleteTarget); setDeleteTarget(null); }}
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

      <div
        className="rounded-2xl border shadow-sm overflow-hidden transition-all"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* Header + Filters + Add Button */}
        <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex-1 flex items-center gap-3">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>Attendance History</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
              style={{ background: 'var(--badge-bg)', borderColor: 'var(--badge-border)', color: 'var(--badge-text)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Plus size={14} />
              <span>Add Past Session</span>
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value as Subject | 'All')}
                className="appearance-none pl-3 pr-7 py-1.5 rounded-xl border text-xs font-semibold outline-none transition-all"
                style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              >
                <option value="All" style={{ background: 'var(--bg-card)' }}>All Subjects</option>
                {SUBJECTS.map(s => <option key={s} value={s} style={{ background: 'var(--bg-card)' }}>{s}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="border rounded-xl px-3 py-1.5 text-xs outline-none"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="p-1.5 rounded-lg border text-xs transition-colors"
                style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                title="Clear date filter"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {completed.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              <p>No completed sessions found for this filter.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-3 rounded-xl text-xs font-semibold border transition-all"
                style={{ background: 'var(--badge-bg)', borderColor: 'var(--badge-border)', color: 'var(--badge-text)' }}
              >
                <Plus size={13} />
                <span>Add your first study session</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-xs font-semibold uppercase tracking-wide border-b"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
                >
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
                    <tr
                      key={s.id}
                      className="border-t transition-colors"
                      style={{
                        borderColor: 'var(--border-color)',
                        background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-subtle)',
                      }}
                    >
                      <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--text-main)' }}>
                        {fmtDate(s.date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${subjectColor(s.subject)}`} />
                          <span style={{ color: 'var(--text-main)' }}>{s.subject}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-secondary)' }}>{fmt(s.startTime)}</td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {s.endTime ? (
                          <div className="flex flex-col">
                            <span>{fmt(s.endTime)}</span>
                            {dateStr(new Date(s.startTime)) !== dateStr(new Date(s.endTime)) && (
                              <span className="text-[10px] text-amber-500 font-medium leading-tight">
                                {fmtDate(dateStr(new Date(s.endTime)))}
                              </span>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-right" style={{ color: 'var(--text-muted)' }}>
                        {breakMs > 0 ? formatDuration(breakMs) : '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-right font-semibold" style={{ color: 'var(--text-main)' }}>
                        {formatDuration(s.productiveDurationMs)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: '#DCFCE7', color: '#16A34A' }}
                        >
                          <CheckCircle2 size={11} />
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditTarget(s)}
                            className="p-1.5 rounded-lg border transition-colors"
                            style={{ background: 'var(--badge-bg)', borderColor: 'var(--badge-border)', color: 'var(--badge-text)' }}
                            title="Edit session"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(s.id)}
                            className="p-1.5 rounded-lg border transition-colors"
                            style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}
                            title="Delete session"
                          >
                            <Trash2 size={13} />
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
          <div className="px-5 py-3 border-t text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
            Showing {completed.length} session{completed.length !== 1 ? 's' : ''} stored in cloud
          </div>
        )}
      </div>
    </>
  );
}
