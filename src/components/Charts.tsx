import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell
} from 'recharts';
import { useApp } from '../AppContext';
import { getWeekStart, dateStr, msToHours, getDaysInMonth, todayStr } from '../storage';
import { DAILY_TARGET_HOURS } from '../types';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-indigo-600 font-bold">{payload[0].value?.toFixed(2)}h</p>
    </div>
  );
}

export function WeeklyChart() {
  const { sessions, todayProductiveMs } = useApp();
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current, -1 = last
  const today = todayStr();

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const weekStart = getWeekStart(baseDate);

  const data = DAY_LABELS.map((day, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const ds = dateStr(d);
    const h = ds === today
      ? msToHours(todayProductiveMs)
      : msToHours(sessions.filter(s => s.date === ds && s.status === 'completed')
          .reduce((acc, s) => acc + s.productiveDurationMs, 0));
    return { day, hours: parseFloat(h.toFixed(2)), isToday: ds === today };
  });

  const weekLabel = weekOffset === 0
    ? 'This Week'
    : weekOffset === -1
      ? 'Last Week'
      : `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Weekly Study Hours</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-gray-600 min-w-20 text-center">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset(w => Math.min(0, w + 1))}
            disabled={weekOffset === 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="text-xs text-gray-400 mb-3 flex items-center gap-3">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-indigo-400" /> Hours Studied</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-rose-400" /> Target (10h)</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={28} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={DAILY_TARGET_HOURS} stroke="#f87171" strokeDasharray="4 2" strokeWidth={1.5} />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isToday ? '#4f46e5' : entry.hours >= DAILY_TARGET_HOURS ? '#10b981' : '#a5b4fc'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyChart() {
  const { sessions, todayProductiveMs } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const today = todayStr();

  const days = getDaysInMonth(year, month);
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const data = Array.from({ length: days }, (_, i) => {
    const d = i + 1;
    const ds = `${monthPrefix}-${String(d).padStart(2, '0')}`;
    const h = ds === today
      ? msToHours(todayProductiveMs)
      : msToHours(sessions.filter(s => s.date === ds && s.status === 'completed')
          .reduce((acc, s) => acc + s.productiveDurationMs, 0));
    return { day: d, hours: parseFloat(h.toFixed(2)) };
  });

  const totalHours = data.reduce((a, d) => a + d.hours, 0);
  const avgHours = totalHours / days;

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    const ny = month === 11 ? year + 1 : year;
    const nm = month === 11 ? 0 : month + 1;
    if (ny > now.getFullYear() || (ny === now.getFullYear() && nm > now.getMonth())) return;
    setMonth(nm); if (month === 11) setYear(y => y + 1);
  };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-900">Monthly Study Hours</h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-gray-600 min-w-24 text-center">{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} disabled={isCurrentMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="flex gap-4 mb-3 text-xs text-gray-500">
        <span>Total: <span className="font-semibold text-gray-800">{totalHours.toFixed(1)}h</span></span>
        <span>Daily Avg: <span className="font-semibold text-gray-800">{avgHours.toFixed(1)}h</span></span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={Math.max(4, Math.floor(560 / days) - 2)} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={4} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={DAILY_TARGET_HOURS} stroke="#f87171" strokeDasharray="4 2" strokeWidth={1.5} />
          <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.hours >= DAILY_TARGET_HOURS ? '#10b981' : '#a5b4fc'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
