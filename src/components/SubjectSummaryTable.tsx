import React from 'react';
import { SUBJECTS } from '../types';
import { useApp } from '../AppContext';
import {
  formatHours, msToHours, todayStr, getWeekStart, dateStr,
  calcSubjectDayProductiveMs, calcSubjectRangeProductiveMs
} from '../storage';

export default function SubjectSummaryTable() {
  const { sessions, activeSession } = useApp();
  const today = todayStr();
  const now = new Date();
  const weekStart = getWeekStart(now);
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return dateStr(d);
  });

  return (
    <div
      className="bg-white rounded-2xl border shadow-sm overflow-hidden"
      style={{ borderColor: '#E2E8F0' }}
    >
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
        <h2 className="text-base font-semibold" style={{ color: '#1E293B' }}>Subject-wise Summary</h2>
        <span className="text-xs" style={{ color: '#64748B' }}>Calculated from actual sessions</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-xs font-semibold uppercase tracking-wide border-b"
              style={{ background: '#F8FAFC', color: '#64748B', borderColor: '#E2E8F0' }}
            >
              <th className="text-left px-5 py-3">Subject</th>
              <th className="text-right px-4 py-3">Today</th>
              <th className="text-right px-4 py-3">This Week</th>
              <th className="text-right px-4 py-3">This Month</th>
              <th className="text-right px-5 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {SUBJECTS.map((subject, i) => {
              // Today: exact calculation including live session
              const todayMs = calcSubjectDayProductiveMs(sessions, activeSession, subject, today);
              const todayH = msToHours(todayMs);

              // Week: matches week dates + live if today
              const weekMs = calcSubjectRangeProductiveMs(sessions, activeSession, subject, d => weekDates.includes(d));
              const weekH = msToHours(weekMs);

              // Month: matches month prefix
              const monthMs = calcSubjectRangeProductiveMs(sessions, activeSession, subject, d => d.startsWith(monthPrefix));
              const monthH = msToHours(monthMs);

              // Total: all time
              const totalMs = calcSubjectRangeProductiveMs(sessions, activeSession, subject);
              const totalH = msToHours(totalMs);

              const isLiveOnThis = activeSession?.subject === subject;

              return (
                <tr
                  key={subject}
                  className="border-t transition-colors"
                  style={{
                    borderColor: '#F1F5F9',
                    background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                  }}
                >
                  <td className="px-5 py-3 font-medium" style={{ color: '#1E293B' }}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${subjectColor(subject)}`} />
                      <span>{subject}</span>
                      {isLiveOnThis && (
                        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
                          LIVE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-right px-4 py-3 tabular-nums font-medium"
                    style={{ color: todayH > 0 ? '#1D4ED8' : '#64748B' }}>
                    {formatHours(todayH)}
                  </td>
                  <td className="text-right px-4 py-3 tabular-nums" style={{ color: '#1E293B' }}>
                    {formatHours(weekH)}
                  </td>
                  <td className="text-right px-4 py-3 tabular-nums" style={{ color: '#1E293B' }}>
                    {formatHours(monthH)}
                  </td>
                  <td className="text-right px-5 py-3 tabular-nums font-bold" style={{ color: '#1E293B' }}>
                    {formatHours(totalH)}
                  </td>
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
    'Maths': 'bg-blue-600',
    'Reasoning': 'bg-purple-600',
    'English': 'bg-teal-500',
    'GS/GK': 'bg-amber-500',
  };
  return colors[subject] ?? 'bg-gray-400';
}

export function subjectHexColor(subject: string): string {
  const colors: Record<string, string> = {
    'Maths': '#2563EB',
    'Reasoning': '#9333EA',
    'English': '#0D9488',
    'GS/GK': '#D97706',
  };
  return colors[subject] ?? '#64748B';
}
