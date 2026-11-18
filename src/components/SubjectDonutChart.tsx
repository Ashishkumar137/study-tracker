import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useApp } from '../AppContext';
import { SUBJECTS } from '../types';
import { msToHours, formatHours, getWeekStart, dateStr, todayStr } from '../storage';
import { subjectHexColor } from './SubjectSummaryTable';

type FilterMode = 'week' | 'month' | 'custom';

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0];
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700">{name}</p>
      <p className="text-gray-600">{formatHours(value)}</p>
      <p className="text-gray-400">{(percent * 100).toFixed(1)}%</p>
    </div>
  );
}

export default function SubjectDonutChart() {
  const { sessions } = useApp();
  const [mode, setMode] = useState<FilterMode>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const today = todayStr();
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

  const data = SUBJECTS.map(subject => ({
    name: subject,
    value: parseFloat(msToHours(
      sessions
        .filter(s => s.status === 'completed' && s.subject === subject && filterSession(s.date))
        .reduce((acc, s) => acc + s.productiveDurationMs, 0)
    ).toFixed(2)),
    color: subjectHexColor(subject),
  })).filter(d => d.value > 0);

  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-gray-900">Subject Distribution</h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['week', 'month', 'custom'] as FilterMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize
                ${mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
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
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <input
            type="date"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      )}

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          No study data for this period
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
                  <p className="text-xs text-gray-600 font-medium">{d.name}</p>
                  <p className="text-xs text-gray-400 tabular-nums">{formatHours(d.value)} · {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">Total: {formatHours(total)}</p>
        </>
      )}
    </div>
  );
}
