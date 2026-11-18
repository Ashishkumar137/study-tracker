import React, { useState } from 'react';
import { ThemeProvider } from './ThemeContext';
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
  const { user, loading, isPasswordRecovery } = useAuth();
  const [page, setPage] = useState<NavPage>('dashboard');

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-app)', color: 'var(--text-main)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin" style={{ color: '#2563EB' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Connecting to Study Tracker...
          </p>
        </div>
      </div>
    );
  }

  if (!user || isPasswordRecovery) {
    return <AuthPage initialMode={isPasswordRecovery ? 'reset-password' : 'login'} />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)', color: 'var(--text-main)' }}>
      <Sidebar currentPage={page} onNavigate={setPage} />

      <main className="lg:ml-56 pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
              {page === 'dashboard' && 'Dashboard'}
              {page === 'analytics' && 'Analytics'}
              {page === 'history' && 'Attendance History'}
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {page === 'dashboard' && 'Track your daily study sessions in real time'}
              {page === 'analytics' && 'Visualise your subject consistency and progress'}
              {page === 'history' && 'Review and manage your cloud-synced study history'}
            </p>
          </div>

          {page === 'dashboard' && <Dashboard />}
          {page === 'analytics' && <Analytics />}
          {page === 'history' && <History />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
