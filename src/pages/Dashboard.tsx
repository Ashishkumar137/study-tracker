import React from 'react';
import AttendanceCard from '../components/AttendanceCard';
import SummaryCards from '../components/SummaryCards';
import SubjectSummaryTable from '../components/SubjectSummaryTable';
import { WeeklyChart } from '../components/Charts';
import DataControls from '../components/DataControls';
import ImportLocalDataBanner from '../components/ImportLocalDataBanner';
import { useApp } from '../AppContext';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { loading, error } = useApp();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={32} className="animate-spin" style={{ color: '#2563EB' }} />
        <p className="text-sm" style={{ color: '#64748B' }}>Loading your study data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ImportLocalDataBanner />
      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm border"
          style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}>
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}
      <AttendanceCard />
      <SummaryCards />
      <SubjectSummaryTable />
      <WeeklyChart />
      <DataControls />
    </div>
  );
}
