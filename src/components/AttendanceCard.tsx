import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';
import { useApp } from '../AppContext';
import { useTheme } from '../ThemeContext';
import { Subject, SUBJECTS, DAILY_TARGET_HOURS } from '../types';
import { formatDuration, formatHours, msToHours, calcProductiveMsLive } from '../storage';

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
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
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors border"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors border"
            style={{ background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttendanceCard() {
  const { activeSession, punchIn, pause, resume, punchOut, todayProductiveMs, targetReachedToday } = useApp();
  const { isDark } = useTheme();

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

  const longSession =
    activeSession?.status === 'active' &&
    Date.now() - new Date(activeSession.startTime).getTime() > 6 * 3600000;

  const statusLabel = !activeSession ? 'Not Started' : activeSession.status === 'active' ? 'Studying' : 'Paused';

  const statusStyle = !activeSession
    ? { color: 'var(--text-secondary)', background: 'var(--bg-subtle)' }
    : activeSession.status === 'active'
      ? { color: '#16A34A', background: isDark ? '#064E3B' : '#F0FDF4' }
      : { color: '#D97706', background: isDark ? '#78350F' : '#FFFBEB' };

  const dateLabel = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeLabel = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

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
          onConfirm={() => {
            punchOut();
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div
        className="rounded-2xl border p-6 shadow-sm transition-all"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              Today
            </p>
            <p className="font-semibold text-lg" style={{ color: 'var(--text-main)' }}>
              {dateLabel}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Clock size={16} style={{ color: '#2563EB' }} />
              <span className="text-2xl font-mono font-bold tabular-nums" style={{ color: 'var(--text-main)' }}>
                {timeLabel}
              </span>
            </div>
            <span className="mt-1 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full" style={statusStyle}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {longSession && (
          <div
            className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm border"
            style={{
              background: isDark ? '#78350F' : '#FFFBEB',
              borderColor: isDark ? '#92400E' : '#FDE68A',
              color: isDark ? '#FDE68A' : '#92400E',
            }}
          >
            <AlertTriangle size={15} className="shrink-0" />
            Session has been active for over 6 hours. Consider taking a break!
          </div>
        )}
        {targetReachedToday && (
          <div
            className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm border"
            style={{
              background: isDark ? '#064E3B' : '#F0FDF4',
              borderColor: isDark ? '#047857' : '#BBF7D0',
              color: isDark ? '#A7F3D0' : '#166534',
            }}
          >
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
          <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            <span>Progress to {targetHours}h target</span>
            <span>
              {Math.min(100, Math.round(progressPct))}%
              {todayHours > targetHours ? ` (+${formatHours(todayHours - targetHours)})` : ''}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
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
          <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
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
              style={
                activeSession
                  ? {
                      background: 'var(--bg-subtle)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-muted)',
                      cursor: 'not-allowed',
                    }
                  : {
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                    }
              }
            >
              {SUBJECTS.map(s => (
                <option key={s} value={s} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>

          {/* Punch In */}
          {!activeSession && (
            <button
              onClick={() => punchIn(selectedSubject)}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={{
                background: 'var(--badge-bg)',
                color: 'var(--badge-text)',
                borderColor: 'var(--badge-border)',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
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
              style={{
                background: isDark ? '#78350F' : '#FFFBEB',
                color: isDark ? '#FDE68A' : '#B45309',
                borderColor: isDark ? '#92400E' : '#FDE68A',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
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
              style={{
                background: isDark ? '#064E3B' : '#F0FDF4',
                color: isDark ? '#6EE7B7' : '#16A34A',
                borderColor: isDark ? '#047857' : '#BBF7D0',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
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
              style={{
                background: isDark ? '#7F1D1D' : '#FEF2F2',
                color: isDark ? '#FCA5A5' : '#DC2626',
                borderColor: isDark ? '#991B1B' : '#FECACA',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Square size={15} />
              Punch Out
            </button>
          )}

          {activeSession && (
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Subject:{' '}
              <span className="font-semibold" style={{ color: '#2563EB' }}>
                {activeSession.subject}
              </span>
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const { isDark } = useTheme();
  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        background: accent ? (isDark ? '#1E3A8A' : '#EFF6FF') : 'var(--bg-subtle)',
        borderColor: accent ? (isDark ? '#1D4ED8' : '#BFDBFE') : 'var(--border-color)',
      }}
    >
      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums" style={{ color: accent ? '#2563EB' : 'var(--text-main)' }}>
        {value}
      </p>
    </div>
  );
}
