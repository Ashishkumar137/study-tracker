import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';
import { useApp } from '../AppContext';
import { Subject, SUBJECTS, DAILY_TARGET_HOURS } from '../types';
import { formatDuration, formatHours, msToHours, calcProductiveMsLive } from '../storage';

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4 w-full border" style={{ borderColor: '#E2E8F0' }}>
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={22} className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
          <p className="text-sm" style={{ color: '#1E293B' }}>{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
            End Session
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttendanceCard() {
  const { activeSession, punchIn, pause, resume, punchOut, todayProductiveMs, targetReachedToday } = useApp();

  const [now, setNow] = useState(new Date());
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Maths');
  const [showConfirm, setShowConfirm] = useState(false);
  const [liveMs, setLiveMs] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      if (activeSession) {
        setLiveMs(calcProductiveMsLive(activeSession.startTime, activeSession.pauses, activeSession.status));
      } else {
        setLiveMs(0);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  const targetHours = DAILY_TARGET_HOURS;
  const todayHours = msToHours(todayProductiveMs);
  const progressPct = Math.min((todayHours / targetHours) * 100, 100);
  const remainingMs = Math.max(0, targetHours * 3600000 - todayProductiveMs);

  const longSession = activeSession?.status === 'active' &&
    (Date.now() - new Date(activeSession.startTime).getTime()) > 6 * 3600000;

  const statusLabel = !activeSession ? 'Not Started'
    : activeSession.status === 'active' ? 'Studying' : 'Paused';

  const statusStyle = !activeSession
    ? { color: '#64748B', background: '#F1F5F9' }
    : activeSession.status === 'active'
      ? { color: '#16A34A', background: '#F0FDF4' }
      : { color: '#D97706', background: '#FFFBEB' };

  const dateLabel = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeLabel = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const breakCount = activeSession?.pauses.length ?? 0;
  const totalBreakMs = activeSession
    ? activeSession.pauses.reduce((acc, p) => {
        const start = new Date(p.pausedAt).getTime();
        const end = p.resumedAt ? new Date(p.resumedAt).getTime() : Date.now();
        return acc + (end - start);
      }, 0)
    : 0;

  return (
    <>
      {showConfirm && (
        <ConfirmDialog
          message="Are you sure you want to end this study session? The session will be saved to the cloud."
          onConfirm={() => { punchOut(); setShowConfirm(false); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: '#E2E8F0' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Today</p>
            <p className="font-semibold text-lg" style={{ color: '#1E293B' }}>{dateLabel}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Clock size={16} style={{ color: '#2563EB' }} />
              <span className="text-2xl font-mono font-bold tabular-nums" style={{ color: '#1E293B' }}>{timeLabel}</span>
            </div>
            <span className="mt-1 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full" style={statusStyle}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {longSession && (
          <div className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm border"
            style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}>
            <AlertTriangle size={15} className="shrink-0" />
            Session has been active for over 6 hours. Consider taking a break!
          </div>
        )}
        {targetReachedToday && (
          <div className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm border"
            style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#166534' }}>
            <CheckCircle2 size={15} className="shrink-0" />
            🎉 Daily target of {targetHours}h achieved! Keep going!
          </div>
        )}

        {/* Stats mini-grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <MiniStat label="Productive Today" value={formatDuration(todayProductiveMs)} accent />
          <MiniStat label="Daily Target" value={`${targetHours}h`} />
          <MiniStat label="Remaining" value={targetReachedToday ? '— Done' : formatDuration(remainingMs)} />
          <MiniStat label="Current Session" value={activeSession ? formatDuration(liveMs) : '—'} />
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: '#64748B' }}>
            <span>Progress to {targetHours}h target</span>
            <span>
              {Math.min(100, Math.round(progressPct))}%
              {todayHours > targetHours ? ` (+${formatHours(todayHours - targetHours)})` : ''}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: targetReachedToday ? '#16A34A' : '#2563EB',
              }}
            />
          </div>
        </div>

        {/* Break info */}
        {activeSession && breakCount > 0 && (
          <p className="mb-4 text-xs" style={{ color: '#94a3b8' }}>
            {breakCount} break{breakCount > 1 ? 's' : ''} · Total break: {formatDuration(totalBreakMs)}
          </p>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Subject selector */}
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value as Subject)}
              disabled={!!activeSession}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl border text-sm font-medium outline-none w-full sm:w-auto transition-all"
              style={activeSession
                ? { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#94a3b8', cursor: 'not-allowed' }
                : { background: '#fff', borderColor: '#E2E8F0', color: '#1E293B', cursor: 'pointer' }}
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} />
          </div>

          {/* Punch In */}
          {!activeSession && (
            <button
              onClick={() => punchIn(selectedSubject)}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={{ background: '#DBEAFE', color: '#1D4ED8', borderColor: '#BFDBFE' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#BFDBFE')}
              onMouseLeave={e => (e.currentTarget.style.background = '#DBEAFE')}
            >
              <Play size={15} />
              Punch In
            </button>
          )}

          {/* Pause */}
          {activeSession?.status === 'active' && (
            <button
              onClick={pause}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={{ background: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FEF3C7')}
              onMouseLeave={e => (e.currentTarget.style.background = '#FFFBEB')}
            >
              <Pause size={15} />
              Pause
            </button>
          )}

          {/* Resume */}
          {activeSession?.status === 'paused' && (
            <button
              onClick={resume}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={{ background: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#DCFCE7')}
              onMouseLeave={e => (e.currentTarget.style.background = '#F0FDF4')}
            >
              <Play size={15} />
              Resume
            </button>
          )}

          {/* Punch Out */}
          {activeSession && (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={{ background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
              onMouseLeave={e => (e.currentTarget.style.background = '#FEF2F2')}
            >
              <Square size={15} />
              Punch Out
            </button>
          )}

          {activeSession && (
            <span className="text-xs font-medium" style={{ color: '#64748B' }}>
              Subject: <span className="font-semibold" style={{ color: '#2563EB' }}>{activeSession.subject}</span>
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-3" style={{ background: accent ? '#EFF6FF' : '#F8FAFC' }}>
      <p className="text-xs mb-1" style={{ color: '#64748B' }}>{label}</p>
      <p className="text-sm font-bold tabular-nums" style={{ color: accent ? '#2563EB' : '#1E293B' }}>{value}</p>
    </div>
  );
}
