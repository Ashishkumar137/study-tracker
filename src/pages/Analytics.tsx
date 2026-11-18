import React from 'react';
import { WeeklyChart, MonthlyChart } from '../components/Charts';
import SubjectDonutChart from '../components/SubjectDonutChart';
import SubjectSummaryTable from '../components/SubjectSummaryTable';
import { useApp } from '../AppContext';
import { getWeekStart, dateStr, msToHours, getDaysInMonth, todayStr } from '../storage';
import { DAILY_TARGET_HOURS } from '../types';
import { CheckCircle2, XCircle } from 'lucide-react';

function WeeklyConsistency() {
  const { sessions, todayProductiveMs } = useApp();
  const now = new Date();
  const today = todayStr();
  const weekStart = getWeekStart(now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Weekly Consistency</h2>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const ds = dateStr(d);
          const h = ds === today
            ? msToHours(todayProductiveMs)
            : msToHours(sessions.filter(s => s.date === ds && s.status === 'completed')
                .reduce((acc, s) => acc + s.productiveDurationMs, 0));
          const reached = h >= DAILY_TARGET_HOURS;
          const isFuture = d > now && ds !== today;
          const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3);
          const dateLabel = d.getDate();

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 font-medium">{dayLabel}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold
                ${isFuture ? 'bg-gray-50 text-gray-300'
                  : reached ? 'bg-green-100 text-green-700'
                  : h > 0 ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-gray-100 text-gray-400'}`}>
                {dateLabel}
              </div>
              <span className="text-xs tabular-nums text-gray-500">{isFuture ? '' : `${h.toFixed(1)}h`}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-200 inline-block" />Target reached</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-100 inline-block" />Partial</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 inline-block" />No study</span>
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
