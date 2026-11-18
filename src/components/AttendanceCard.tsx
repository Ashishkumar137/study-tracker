import React, { useState, useEffect, useCallback } from 'react';
import {
  Play, Pause, Square, Clock, Target, CheckCircle2,
  AlertTriangle, ChevronDown
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Subject, SUBJECTS, DAILY_TARGET_HOURS } from '../types';
import { formatDuration, formatHours, msToHours, calcProductiveMsLive } from '../storage';

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
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Confirm
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
  const [showLongSessionWarning, setShowLongSessionWarning] = useState(false);
  const [liveMs, setLiveMs] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      if (activeSession) {
        setLiveMs(calcProductiveMsLive(activeSession.startTime, activeSession.pauses, activeSession.status));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  // Long session warning (> 6h continuous)
  useEffect(() => {
    if (activeSession && activeSession.status === 'active') {
      const elapsed = Date.now() - new Date(activeSession.startTime).getTime();
      setShowLongSessionWarning(elapsed > 6 * 3600000);
    } else {
      setShowLongSessionWarning(false);
    }
  }, [activeSession, liveMs]);

  const targetHours = DAILY_TARGET_HOURS;
  const todayHours = msToHours(todayProductiveMs);
  const progressPct = Math.min((todayHours / targetHours) * 100, 100);
  const remainingMs = Math.max(0, targetHours * 3600000 - todayProductiveMs);

  const statusLabel = !activeSession
    ? 'Not Started'
    : activeSession.status === 'active'
      ? 'Studying'
      : 'Paused';

  const statusColor = !activeSession
    ? 'text-gray-500 bg-gray-100'
    : activeSession.status === 'active'
      ? 'text-green-700 bg-green-100'
      : 'text-amber-700 bg-amber-100';

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handlePunchOut = () => setShowConfirm(true);
  const confirmPunchOut = () => { punchOut(); setShowConfirm(false); };

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
          message="Are you sure you want to end this study session? The session will be saved."
          onConfirm={confirmPunchOut}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-1">Today</p>
            <p className="text-gray-900 font-semibold text-lg">{dateStr}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Clock size={16} className="text-indigo-500" />
              <span className="text-2xl font-mono font-bold text-gray-900 tabular-nums">{timeStr}</span>
            </div>
            <span className={`mt-1 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Long session warning */}
        {showLongSessionWarning && (
          <div className="mb-4 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            Session has been active for over 6 hours. Consider taking a break!
          </div>
        )}

        {/* Target reached banner */}
        {targetReachedToday && (
          <div className="mb-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
            <CheckCircle2 size={16} className="shrink-0" />
            🎉 Daily target of {targetHours}h achieved! Keep going!
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Stat label="Productive Today" value={formatDuration(todayProductiveMs)} accent />
          <Stat label="Daily Target" value={`${targetHours}h`} />
          <Stat label="Remaining" value={targetReachedToday ? '—' : formatDuration(remainingMs)} />
          <Stat label="Current Session" value={activeSession ? formatDuration(liveMs) : '—'} />
        </div>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Progress to {targetHours}h target</span>
            <span>{Math.min(100, Math.round(progressPct))}%{todayHours > targetHours ? ` (+${formatHours(todayHours - targetHours)})` : ''}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${targetReachedToday ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Break info */}
        {activeSession && breakCount > 0 && (
          <div className="mb-4 text-xs text-gray-500">
            {breakCount} break{breakCount > 1 ? 's' : ''} · Total break: {formatDuration(totalBreakMs)}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Subject Selector */}
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value as Subject)}
              disabled={!!activeSession}
              className={`appearance-none pl-3 pr-8 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full sm:w-auto
                ${activeSession
                  ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400 cursor-pointer'}`}
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Punch In */}
          {!activeSession && (
            <button
              onClick={() => punchIn(selectedSubject)}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            >
              <Play size={16} />
              Punch In
            </button>
          )}

          {/* Pause / Resume */}
          {activeSession && activeSession.status === 'active' && (
            <button
              onClick={pause}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
            >
              <Pause size={16} />
              Pause
            </button>
          )}
          {activeSession && activeSession.status === 'paused' && (
            <button
              onClick={resume}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
            >
              <Play size={16} />
              Resume
            </button>
          )}

          {/* Punch Out */}
          {activeSession && (
            <button
              onClick={handlePunchOut}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors"
            >
              <Square size={16} />
              Punch Out
            </button>
          )}

          {/* Active subject indicator */}
          {activeSession && (
            <span className="text-xs text-gray-500 font-medium">
              Subject: <span className="text-indigo-700 font-semibold">{activeSession.subject}</span>
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? 'bg-indigo-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-base font-bold tabular-nums ${accent ? 'text-indigo-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
