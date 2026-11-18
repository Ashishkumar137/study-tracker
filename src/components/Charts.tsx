import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell
} from 'recharts';
import { useApp } from '../AppContext';
import { useTheme } from '../ThemeContext';
import { getWeekStart, dateStr, msToHours, getDaysInMonth, todayStr, calcDayProductiveMs } from '../storage';
import { DAILY_TARGET_HOURS } from '../types';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="border shadow-lg rounded-xl px-3 py-2 text-sm"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <p className="font-semibold mb-0.5" style={{ color: 'var(--text-main)' }}>
        {label}
      </p>
      <p className="font-bold text-base" style={{ color: '#2563EB' }}>
        {payload[0].value?.toFixed(2)}h
      </p>
    </div>
  );
}

export function WeeklyChart() {
  const { sessions, activeSession } = useApp();
  const { isDark } = useTheme();
  const [weekOffset, setWeekOffset] = useState(0);
  const today = todayStr();

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const weekStart = getWeekStart(baseDate);

  const data = DAY_LABELS.map((day, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const ds = dateStr(d);
    const dayMs = calcDayProductiveMs(sessions, ds === today ? activeSession : null, ds);
    const h = msToHours(dayMs);
    return {
      day,
      date: ds,
      hours: parseFloat(h.toFixed(2)),
      isToday: ds === today,
    };
  });

  const weekLabel =
    weekOffset === 0
      ? 'This Week'
      : weekOffset === -1
        ? 'Last Week'
        : `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;

  return (
    <div
      className="rounded-2xl border p-5 shadow-sm transition-all"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
          Weekly Study Hours
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-1.5 rounded-lg border text-sm transition-all"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            title="Previous week"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-semibold px-2 min-w-20 text-center" style={{ color: 'var(--text-main)' }}>
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekOffset(w => Math.min(0, w + 1))}
            disabled={weekOffset === 0}
            className="p-1.5 rounded-lg border text-sm transition-all disabled:opacity-30"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            title="Next week"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="text-xs mb-3 flex items-center gap-4" style={{ color: 'var(--text-secondary)' }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded" style={{ background: '#93C5FD' }} /> Studied
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded" style={{ background: '#16A34A' }} /> Reached Target
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5" style={{ background: '#EF4444' }} /> Target (10h)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={28} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#F1F5F9'} vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={DAILY_TARGET_HOURS} stroke="#EF4444" strokeDasharray="4 2" strokeWidth={1.5} />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.isToday
                    ? '#2563EB'
                    : entry.hours >= DAILY_TARGET_HOURS
                      ? '#16A34A'
                      : isDark
                        ? '#3B82F6'
                        : '#93C5FD'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyChart() {
  const { sessions, activeSession } = useApp();
  const { isDark } = useTheme();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const today = todayStr();

  const days = getDaysInMonth(year, month);
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const data = Array.from({ length: days }, (_, i) => {
    const d = i + 1;
    const ds = `${monthPrefix}-${String(d).padStart(2, '0')}`;
    const dayMs = calcDayProductiveMs(sessions, ds === today ? activeSession : null, ds);
    const h = msToHours(dayMs);
    return { day: d, hours: parseFloat(h.toFixed(2)) };
  });

  const totalHours = data.reduce((a, d) => a + d.hours, 0);
  const avgHours = totalHours / days;

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    const isCurrent = year === now.getFullYear() && month === now.getMonth();
    if (isCurrent) return;
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div
      className="rounded-2xl border p-5 shadow-sm transition-all"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
          Monthly Study Hours
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border text-sm transition-all"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            title="Previous month"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-semibold px-2 min-w-24 text-center" style={{ color: 'var(--text-main)' }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg border text-sm transition-all disabled:opacity-30"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            title="Next month"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span>
          Total: <strong style={{ color: 'var(--text-main)' }}>{totalHours.toFixed(1)}h</strong>
        </span>
        <span>
          Daily Avg: <strong style={{ color: 'var(--text-main)' }}>{avgHours.toFixed(1)}h</strong>
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={Math.max(4, Math.floor(560 / days) - 2)} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#F1F5F9'} vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} interval={3} />
          <YAxis tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={DAILY_TARGET_HOURS} stroke="#EF4444" strokeDasharray="4 2" strokeWidth={1.5} />
          <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.hours >= DAILY_TARGET_HOURS
                    ? '#16A34A'
                    : isDark
                      ? '#3B82F6'
                      : '#93C5FD'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
