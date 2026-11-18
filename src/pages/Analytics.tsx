import React from 'react';
import { WeeklyChart, MonthlyChart } from '../components/Charts';
import SubjectDonutChart from '../components/SubjectDonutChart';
import SubjectSummaryTable from '../components/SubjectSummaryTable';
import { useApp } from '../AppContext';
import { useTheme } from '../ThemeContext';
import { getWeekStart, dateStr, msToHours, todayStr, calcDayProductiveMs } from '../storage';
import { DAILY_TARGET_HOURS } from '../types';

function WeeklyConsistency() {
  const { sessions, activeSession } = useApp();
  const { isDark } = useTheme();
  const now = new Date();
  const today = todayStr();
  const weekStart = getWeekStart(now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="rounded-2xl border p-5 shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-main)' }}>Weekly Target Consistency</h2>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const ds = dateStr(d);
          const dayMs = calcDayProductiveMs(sessions, ds === today ? activeSession : null, ds);
          const h = msToHours(dayMs);
          const reached = h >= DAILY_TARGET_HOURS;
          const isFuture = d > now && ds !== today;
          const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3);
          const dateLabel = d.getDate();

          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{dayLabel}</span>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border transition-all"
                style={
                  isFuture
                    ? { background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }
                    : reached
                      ? { background: isDark ? '#064E3B' : '#DCFCE7', borderColor: isDark ? '#047857' : '#BBF7D0', color: isDark ? '#6EE7B7' : '#16A34A' }
                      : h > 0
                        ? { background: isDark ? '#1C1C24' : '#DBEAFE', borderColor: isDark ? '#33333F' : '#BFDBFE', color: isDark ? '#60A5FA' : '#2563EB' }
                        : { background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }
                }
              >
                {dateLabel}
              </div>
              <span className="text-[11px] tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>
                {isFuture ? '—' : `${h.toFixed(1)}h`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: isDark ? '#064E3B' : '#DCFCE7', border: `1px solid ${isDark ? '#047857' : '#BBF7D0'}` }} /> Target reached (10h+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: isDark ? '#1C1C24' : '#DBEAFE', border: `1px solid ${isDark ? '#33333F' : '#BFDBFE'}` }} /> Partial study
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }} /> No study
        </span>
      </div>
    </div>
  );
}

export default function Analytics() {
  return (
    <div className="space-y-6">
      <WeeklyConsistency />
      <div className="grid lg:grid-cols-2 gap-6">
        <WeeklyChart />
        <SubjectDonutChart />
      </div>
      <MonthlyChart />
      <SubjectSummaryTable />
    </div>
  );
}
