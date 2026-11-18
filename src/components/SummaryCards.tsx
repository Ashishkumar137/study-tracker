import React from 'react';
import { Clock, Target, TrendingUp, Calendar, BookOpen, CheckCircle2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { formatHours, msToHours, todayStr, getDaysInMonth, getWeekStart, dateStr } from '../storage';
import { DAILY_TARGET_HOURS, SUBJECTS } from '../types';

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
  return (
    <div className={`rounded-2xl border p-5 bg-white shadow-sm flex flex-col gap-2
      ${achieved ? 'border-green-200' : 'border-gray-200'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center
        ${achieved ? 'bg-green-100' : accent ? 'bg-indigo-100' : 'bg-gray-100'}`}>
        <span className={achieved ? 'text-green-600' : accent ? 'text-indigo-600' : 'text-gray-500'}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${achieved ? 'text-green-700' : accent ? 'text-indigo-700' : 'text-gray-900'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {achieved && (
        <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
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
  const todaySessions = sessions.filter(s => s.date === today && s.status === 'completed').length
    + (activeSession ? 1 : 0);
  const targetAchieved = todayHours >= DAILY_TARGET_HOURS;

  // Weekly average
  const weekStart = getWeekStart(now);
  let weekTotal = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const ds = dateStr(d);
    if (ds === today) {
      weekTotal += todayProductiveMs / 3600000;
    } else {
      const dayMs = sessions.filter(s => s.date === ds && s.status === 'completed')
        .reduce((a, s) => a + s.productiveDurationMs, 0);
      weekTotal += dayMs / 3600000;
    }
  }
  const weekAvg = weekTotal / 7;

  // Weekly consistency (days reaching target)
  let weekDaysReached = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const ds = dateStr(d);
    const dayHours = ds === today
      ? todayHours
      : msToHours(sessions.filter(s => s.date === ds && s.status === 'completed').reduce((a, s) => a + s.productiveDurationMs, 0));
    if (dayHours >= DAILY_TARGET_HOURS) weekDaysReached++;
  }

  // Monthly average
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  let monthTotal = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (ds === today) {
      monthTotal += todayProductiveMs / 3600000;
    } else {
      const dayMs = sessions.filter(s => s.date === ds && s.status === 'completed')
        .reduce((a, s) => a + s.productiveDurationMs, 0);
      monthTotal += dayMs / 3600000;
    }
  }
  const monthAvg = monthTotal / daysInMonth;

  // Active study days this month
  const studyDays = new Set<string>();
  sessions.filter(s => s.status === 'completed' && s.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
    .forEach(s => studyDays.add(s.date));
  if (today.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`) && todayHours > 0) studyDays.add(today);
  const activeStudyDays = studyDays.size;
  const monthAvgActiveDay = activeStudyDays > 0 ? monthTotal / activeStudyDays : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        icon={<Clock size={18} />}
        label="Productive Today"
        value={formatHours(todayHours)}
        sub={`${Math.round(todayHours * 60)} min`}
        accent
        achieved={targetAchieved}
      />
      <StatCard
        icon={<Target size={18} />}
        label="Daily Target"
        value={`${DAILY_TARGET_HOURS}h`}
        sub="Minimum goal"
      />
      <StatCard
        icon={<Clock size={18} />}
        label="Remaining"
        value={targetAchieved ? '✓ Done' : formatHours(Math.max(0, DAILY_TARGET_HOURS - todayHours))}
        sub={targetAchieved ? 'Target achieved' : 'to reach target'}
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
        sub={`${formatHours(monthAvgActiveDay)}/active day`}
      />
      <StatCard
        icon={<BookOpen size={18} />}
        label="Sessions Today"
        value={String(todaySessions)}
        sub={`Week: ${weekDaysReached} days on target`}
      />
    </div>
  );
}
