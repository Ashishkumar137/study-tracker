import React from 'react';
import { WeeklyChart, MonthlyChart } from '../components/Charts';
import SubjectDonutChart from '../components/SubjectDonutChart';
import SubjectSummaryTable from '../components/SubjectSummaryTable';
import { useApp } from '../AppContext';
import { getWeekStart, dateStr, msToHours, todayStr, calcDayProductiveMs } from '../storage';
import { DAILY_TARGET_HOURS } from '../types';

function WeeklyConsistency() {
  const { sessions, activeSession } = useApp();
  const now = new Date();
  const today = todayStr();
  const weekStart = getWeekStart(now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: '#E2E8F0' }}>
      <h2 className="text-base font-semibold mb-4" style={{ color: '#1E293B' }}>Weekly Target Consistency</h2>
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
              <span className="text-xs font-medium" style={{ color: '#64748B' }}>{dayLabel}</span>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border transition-all"
                style={
                  isFuture
                    ? { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#CBD5E1' }
                    : reached
                      ? { background: '#DCFCE7', borderColor: '#BBF7D0', color: '#16A34A' }
                      : h > 0
                        ? { background: '#DBEAFE', borderColor: '#BFDBFE', color: '#2563EB' }
                        : { background: '#F1F5F9', borderColor: '#E2E8F0', color: '#94A3B8' }
                }
              >
                {dateLabel}
              </div>
              <span className="text-[11px] tabular-nums font-medium" style={{ color: '#64748B' }}>
                {isFuture ? '—' : `${h.toFixed(1)}h`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-4 text-xs" style={{ color: '#64748B' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }} /> Target reached (10h+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: '#DBEAFE', border: '1px solid #BFDBFE' }} /> Partial study
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }} /> No study
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
