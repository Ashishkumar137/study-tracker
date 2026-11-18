import React from 'react';
import AttendanceCard from '../components/AttendanceCard';
import SummaryCards from '../components/SummaryCards';
import SubjectSummaryTable from '../components/SubjectSummaryTable';
import { WeeklyChart } from '../components/Charts';
import DataControls from '../components/DataControls';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <AttendanceCard />
      <SummaryCards />
      <SubjectSummaryTable />
      <WeeklyChart />
      <DataControls />
    </div>
  );
}
