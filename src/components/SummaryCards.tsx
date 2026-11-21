import React from 'react';
import { Clock, Target, TrendingUp, Calendar, BookOpen, CheckCircle2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { useTheme } from '../ThemeContext';
import { formatHours, msToHours, todayStr, getDaysInMonth, getWeekStart, dateStr, calcDayProductiveMs } from '../storage';
import { DAILY_TARGET_HOURS } from '../types';

function StatCard({
  icon, label, value, sub, accent, achieved
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  achieved?: boolean;
}) {
  const { isDark } = useTheme();

  return (
    <div
      className="rounded-2xl border p-5 shadow-sm flex flex-col gap-2 transition-all"
      style={{
        borderColor: achieved ? (isDark ? '#047857' : '#BBF7D0') : 'var(--border-color)',
        background: 'var(--bg-card)',
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all"
        style={{
          background: achieved
            ? (isDark ? '#064E3B' : '#DCFCE7')
            : accent
              ? (isDark ? '#1C1C24' : '#DBEAFE')
              : 'var(--bg-subtle)',
          borderColor: achieved
            ? (isDark ? '#047857' : '#BBF7D0')
            : accent
              ? (isDark ? '#33333F' : '#BFDBFE')
              : 'var(--border-color)',
        }}
      >
        <span style={{ color: achieved ? (isDark ? '#4ADE80' : '#16A34A') : accent ? (isDark ? '#60A5FA' : '#2563EB') : 'var(--text-secondary)' }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p
          className="text-2xl font-bold mt-0.5 tabular-nums"
          style={{
            color: achieved ? (isDark ? '#4ADE80' : '#16A34A') : accent ? (isDark ? '#60A5FA' : '#2563EB') : 'var(--text-main)',
          }}
        >
          {value}
        </p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
      {achieved && (
        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#16A34A' }}>
          <CheckCircle2 size={13} />
          Target Achieved!
        </div>
      )}
    </div>
  );
}

export default function SummaryCards() {
  const { sessions, todayProductiveMs, activeSession } = useApp();
  const today = todayStr();
  const now = new Date();

  // Today stats
  const todayHours = msToHours(todayProductiveMs);
  const targetAchieved = todayHours >= DAILY_TARGET_HOURS;

  // Count sessions today (sessions started today or active today)
  const todaySessionsCount = sessions.filter(s =>
    s.status === 'completed' && (s.date === today || calcDayProductiveMs([s], null, today) > 0)
  ).length + (activeSession ? 1 : 0);

  // Weekly average (Mon - Sun of current week)
  const weekStart = getWeekStart(now);
  let weekTotalHours = 0;
  let weekDaysReached = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const ds = dateStr(d);
    const dayMs = ds === today ? todayProductiveMs : calcDayProductiveMs(sessions, null, ds);
    const dayH = msToHours(dayMs);
    weekTotalHours += dayH;
    if (dayH >= DAILY_TARGET_HOURS) {
      weekDaysReached++;
    }
  }
  const weekAvg = weekTotalHours / 7;

  // Monthly average
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  let monthTotalHours = 0;
  let activeStudyDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayMs = ds === today ? todayProductiveMs : calcDayProductiveMs(sessions, null, ds);
    const dayH = msToHours(dayMs);
    monthTotalHours += dayH;
    if (dayH > 0.05) {
      activeStudyDays++;
    }
  }
  const monthAvg = monthTotalHours / daysInMonth;
  const monthAvgActiveDay = activeStudyDays > 0 ? monthTotalHours / activeStudyDays : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        icon={<Clock size={18} />}
        label="Productive Today"
        value={formatHours(todayHours)}
        sub={`${Math.round(todayHours * 60)} min total`}
        accent
        achieved={targetAchieved}
      />
      <StatCard
        icon={<Target size={18} />}
        label="Daily Target"
        value={`${DAILY_TARGET_HOURS}h`}
        sub="Minimum daily goal"
      />
      <StatCard
        icon={<Clock size={18} />}
        label="Remaining"
        value={targetAchieved ? '✓ Done' : formatHours(Math.max(0, DAILY_TARGET_HOURS - todayHours))}
        sub={targetAchieved ? 'Target achieved!' : 'to reach 10h target'}
        achieved={targetAchieved}
      />
      <StatCard
        icon={<TrendingUp size={18} />}
        label="Weekly Avg"
        value={formatHours(weekAvg)}
        sub={`${weekDaysReached}/7 days on target`}
      />
      <StatCard
        icon={<Calendar size={18} />}
        label="Monthly Avg"
        value={formatHours(monthAvg)}
        sub={`${formatHours(monthAvgActiveDay)}/active day (${activeStudyDays}d)`}
      />
      <StatCard
        icon={<BookOpen size={18} />}
        label="Sessions Today"
        value={String(todaySessionsCount)}
        sub={`Week: ${weekDaysReached} days on target`}
      />
    </div>
  );
}
