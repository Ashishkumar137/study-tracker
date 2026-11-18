import React from 'react';
import { SUBJECTS, DAILY_TARGET_HOURS } from '../types';
import { useApp } from '../AppContext';
import { msToHours, formatHours, todayStr, getWeekStart, dateStr, getDaysInMonth } from '../storage';

export default function SubjectSummaryTable() {
  const { sessions, todayProductiveMs, activeSession } = useApp();
  const today = todayStr();
  const now = new Date();
  const weekStart = getWeekStart(now);
  const year = now.getFullYear();
  const month = now.getMonth();

  function getHoursForSubject(
    subject: string,
    filter: (date: string) => boolean,
    includeLive = false
  ): number {
    const completed = sessions.filter(
      s => s.status === 'completed' && s.subject === subject && filter(s.date)
    ).reduce((acc, s) => acc + s.productiveDurationMs, 0);

    const live =
      includeLive && activeSession && activeSession.subject === subject
        ? (sessions.find(s => s.id === activeSession.sessionId)?.productiveDurationMs ?? 0)
        : 0;

    return msToHours(completed + live);
  }

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return dateStr(d);
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Subject-wise Summary</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wide">
              <th className="text-left px-5 py-3">Subject</th>
              <th className="text-right px-4 py-3">Today</th>
              <th className="text-right px-4 py-3">This Week</th>
              <th className="text-right px-4 py-3">This Month</th>
              <th className="text-right px-5 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {SUBJECTS.map((subject, i) => {
              const todayH = getHoursForSubject(subject, d => d === today, true);
              const weekH = getHoursForSubject(subject, d => weekDates.includes(d));
              const monthH = getHoursForSubject(subject, d => d.startsWith(monthPrefix));
              const totalH = getHoursForSubject(subject, () => true);

              return (
                <tr key={subject} className={`border-t border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                  <td className="px-5 py-3 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${subjectColor(subject)}`} />
                      {subject}
                    </div>
                  </td>
                  <td className="text-right px-4 py-3 tabular-nums text-gray-700">{formatHours(todayH)}</td>
                  <td className="text-right px-4 py-3 tabular-nums text-gray-700">{formatHours(weekH)}</td>
                  <td className="text-right px-4 py-3 tabular-nums text-gray-700">{formatHours(monthH)}</td>
                  <td className="text-right px-5 py-3 tabular-nums font-semibold text-gray-900">{formatHours(totalH)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function subjectColor(subject: string): string {
  const colors: Record<string, string> = {
    'Maths': 'bg-indigo-500',
    'Reasoning': 'bg-violet-500',
    'English': 'bg-cyan-500',
    'GS/GK': 'bg-emerald-500',
  };
  return colors[subject] ?? 'bg-gray-400';
}

export function subjectHexColor(subject: string): string {
  const colors: Record<string, string> = {
    'Maths': '#6366f1',
    'Reasoning': '#8b5cf6',
    'English': '#06b6d4',
    'GS/GK': '#10b981',
  };
  return colors[subject] ?? '#94a3b8';
}
