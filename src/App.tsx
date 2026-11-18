import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { AppProvider } from './AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import History from './pages/History';
import AuthPage from './pages/AuthPage';
import { NavPage } from './types';
import { Loader2 } from 'lucide-react';

function AppShell() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<NavPage>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin" style={{ color: '#2563EB' }} />
          <p className="text-sm" style={{ color: '#64748B' }}>Initialising…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AppProvider>
        <AuthPage />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <div className="min-h-screen" style={{ background: '#F8FAFC', color: '#1E293B' }}>
        <Sidebar currentPage={page} onNavigate={setPage} />

        <main className="lg:ml-56 pt-16 lg:pt-0 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-xl font-bold" style={{ color: '#1E293B' }}>
                {page === 'dashboard' && 'Dashboard'}
                {page === 'analytics' && 'Analytics'}
                {page === 'history' && 'Attendance History'}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
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

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
