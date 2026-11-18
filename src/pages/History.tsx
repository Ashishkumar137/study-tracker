import React from 'react';
import HistoryTable from '../components/HistoryTable';
import DataControls from '../components/DataControls';

export default function History() {
  return (
    <div className="space-y-6">
      <HistoryTable />
      <DataControls />
    </div>
  );
}
