import React, { useState } from 'react';
import { AppProvider } from './AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import History from './pages/History';
import { NavPage } from './types';

export default function App() {
  const [page, setPage] = useState<NavPage>('dashboard');

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Sidebar currentPage={page} onNavigate={setPage} />

        {/* Main content - offset for sidebar on desktop, padded top for mobile header */}
        <main className="lg:ml-56 pt-16 lg:pt-0 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">
                {page === 'dashboard' && 'Dashboard'}
                {page === 'analytics' && 'Analytics'}
                {page === 'history' && 'Attendance History'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {page === 'dashboard' && 'Track your daily SSC CGL study sessions'}
                {page === 'analytics' && 'Visualise your study patterns and progress'}
                {page === 'history' && 'Review and manage past study sessions'}
              </p>
            </div>

            {page === 'dashboard' && <Dashboard />}
            {page === 'analytics' && <Analytics />}
            {page === 'history' && <History />}
          </div>
        </main>
      </div>
    </AppProvider>
  );
}
