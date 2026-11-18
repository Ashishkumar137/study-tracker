import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../AppContext';
import { SUBJECTS } from '../types';
import { msToHours, formatHours, getWeekStart, dateStr, todayStr, calcSubjectRangeProductiveMs } from '../storage';
import { subjectHexColor } from './SubjectSummaryTable';

type FilterMode = 'week' | 'month' | 'custom';

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0];
  return (
    <div className="bg-white border shadow-lg rounded-xl px-3 py-2 text-sm" style={{ borderColor: '#E2E8F0' }}>
      <p className="font-semibold" style={{ color: '#1E293B' }}>{name}</p>
      <p style={{ color: '#2563EB' }}>{formatHours(value)}</p>
      <p className="text-xs" style={{ color: '#64748B' }}>{(percent * 100).toFixed(1)}%</p>
    </div>
  );
}

export default function SubjectDonutChart() {
  const { sessions, activeSession } = useApp();
  const [mode, setMode] = useState<FilterMode>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const now = new Date();

  function filterSession(date: string): boolean {
    if (mode === 'week') {
      const ws = getWeekStart(now);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      return date >= dateStr(ws) && date <= dateStr(we);
    }
    if (mode === 'month') {
      const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return date.startsWith(prefix);
    }
    if (mode === 'custom' && customFrom && customTo) {
      return date >= customFrom && date <= customTo;
    }
    return true;
  }

  const data = SUBJECTS.map(subject => {
    const ms = calcSubjectRangeProductiveMs(sessions, activeSession, subject, filterSession);
    const hours = parseFloat(msToHours(ms).toFixed(2));
    return {
      name: subject,
      value: hours,
      color: subjectHexColor(subject),
    };
  }).filter(d => d.value > 0);

  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: '#E2E8F0' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold" style={{ color: '#1E293B' }}>Subject Distribution</h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['week', 'month', 'custom'] as FilterMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize"
              style={mode === m
                ? { background: '#DBEAFE', color: '#1D4ED8', borderColor: '#BFDBFE' }
                : { background: '#F8FAFC', color: '#64748B', borderColor: '#E2E8F0' }}
            >
              {m === 'week' ? 'This Week' : m === 'month' ? 'This Month' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'custom' && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            type="date"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-xs outline-none"
            style={{ borderColor: '#E2E8F0', color: '#1E293B', background: '#FFFFFF' }}
          />
          <input
            type="date"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-xs outline-none"
            style={{ borderColor: '#E2E8F0', color: '#1E293B', background: '#FFFFFF' }}
          />
        </div>
      )}

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-xs" style={{ color: '#94a3b8' }}>
          No study data recorded for this period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {data.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: '#1E293B' }}>{d.name}</p>
                  <p className="text-xs tabular-nums" style={{ color: '#64748B' }}>
                    {formatHours(d.value)} · {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs mt-3 font-medium" style={{ color: '#64748B' }}>
            Total: <span style={{ color: '#1E293B' }}>{formatHours(total)}</span>
          </p>
        </>
      )}
    </div>
  );
}
