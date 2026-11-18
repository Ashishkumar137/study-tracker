import React, { useState } from 'react';
import {
  BookOpen, BarChart2, History, Menu, X, LogOut, User,
  Cloud, RefreshCw, AlertCircle, WifiOff, Sun, Moon
} from 'lucide-react';
import { NavPage } from '../types';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';
import { useTheme } from '../ThemeContext';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}

const navItems: { id: NavPage; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <BookOpen size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
  { id: 'history', label: 'History', icon: <History size={18} /> },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { syncStatus, refreshSessions } = useApp();
  const { isDark, toggleTheme } = useTheme();

  const ThemeToggle = ({ compact = false }: { compact?: boolean }) => (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold border transition-all ${
        compact ? 'p-2' : 'w-full py-2 px-3'
      }`}
      style={{
        background: 'var(--bg-subtle)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-main)',
      }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <>
          <Sun size={15} className="text-amber-400 shrink-0" />
          {!compact && <span>Light Mode</span>}
        </>
      ) : (
        <>
          <Moon size={15} className="text-indigo-600 shrink-0" />
          {!compact && <span>Dark Mode</span>}
        </>
      )}
    </button>
  );

  const SyncBadge = () => {
    if (!user) return null;
    return (
      <div
        className="px-3 py-1.5 mx-3 mb-2 rounded-xl text-[11px] font-medium flex items-center justify-between border"
        style={
          syncStatus === 'synced'
            ? { background: isDark ? '#064E3B' : '#F0FDF4', borderColor: isDark ? '#047857' : '#BBF7D0', color: isDark ? '#6EE7B7' : '#16A34A' }
            : syncStatus === 'syncing'
              ? { background: isDark ? '#1E3A8A' : '#EFF6FF', borderColor: isDark ? '#1D4ED8' : '#BFDBFE', color: isDark ? '#93C5FD' : '#2563EB' }
              : syncStatus === 'offline'
                ? { background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                : { background: isDark ? '#7F1D1D' : '#FEF2F2', borderColor: isDark ? '#B91C1C' : '#FECACA', color: isDark ? '#FCA5A5' : '#DC2626' }
        }
      >
        <span className="flex items-center gap-1.5 truncate">
          {syncStatus === 'synced' && <Cloud size={13} className="shrink-0" />}
          {syncStatus === 'syncing' && <RefreshCw size={13} className="shrink-0 animate-spin" />}
          {syncStatus === 'offline' && <WifiOff size={13} className="shrink-0" />}
          {syncStatus === 'error' && <AlertCircle size={13} className="shrink-0" />}
          <span>
            {syncStatus === 'synced' && 'Realtime Synced'}
            {syncStatus === 'syncing' && 'Syncing...'}
            {syncStatus === 'offline' && 'Offline'}
            {syncStatus === 'error' && 'Sync error'}
          </span>
        </span>
        <button
          onClick={() => refreshSessions()}
          title="Force refresh from cloud"
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
        >
          <RefreshCw size={11} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
        </button>
      </div>
    );
  };

  const NavLinks = () => (
    <nav className="flex-1 py-3 px-3">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all border"
          style={
            currentPage === item.id
              ? { background: 'var(--badge-bg)', borderColor: 'var(--badge-border)', color: 'var(--badge-text)' }
              : { background: 'transparent', borderColor: 'transparent', color: 'var(--text-secondary)' }
          }
          onMouseEnter={e => {
            if (currentPage !== item.id) {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-subtle)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)';
            }
          }}
          onMouseLeave={e => {
            if (currentPage !== item.id) {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
            }
          }}
        >
          <span style={{ color: currentPage === item.id ? '#2563EB' : 'var(--text-muted)' }}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );

  const UserFooter = () => (
    <div className="px-4 py-4 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
      {/* Theme Toggle Button inside sidebar */}
      <ThemeToggle />

      {user ? (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
            style={{ background: 'var(--badge-bg)', borderColor: 'var(--badge-border)' }}
          >
            <User size={14} style={{ color: '#2563EB' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-main)' }} title={user.email}>
              {user.email}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Personal Dashboard</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out of account"
            className="p-1.5 rounded-xl border transition-colors shrink-0"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#FEF2F2';
              e.currentTarget.style.borderColor = '#FECACA';
              e.currentTarget.style.color = '#DC2626';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-subtle)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Study Tracker</p>
      )}
    </div>
  );

  const Logo = () => (
    <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: '#2563EB' }}>
        <BookOpen size={15} className="text-white" />
      </div>
      <div>
        <span className="font-bold text-base block leading-tight" style={{ color: 'var(--text-main)' }}>Study Tracker</span>
        <span className="text-[10px] font-semibold tracking-wider uppercase block" style={{ color: '#2563EB' }}>Productivity</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 min-h-screen fixed left-0 top-0 z-30 border-r"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <Logo />
        <NavLinks />
        <SyncBadge />
        <UserFooter />
      </aside>

      {/* Mobile Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-30 border-b flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: '#2563EB' }}>
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-bold text-base" style={{ color: 'var(--text-main)' }}>Study Tracker</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile Theme Toggle Button */}
          <ThemeToggle compact />

          {user && (
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{
                background: syncStatus === 'synced' ? '#16A34A' : syncStatus === 'syncing' ? '#2563EB' : '#DC2626',
              }}
              title={`Status: ${syncStatus}`}
            />
          )}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="p-2 rounded-xl border"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div
            className="w-64 h-full shadow-2xl flex flex-col"
            style={{ background: 'var(--bg-card)' }}
            onClick={e => e.stopPropagation()}
          >
            <Logo />
            <NavLinks />
            <SyncBadge />
            <UserFooter />
          </div>
        </div>
      )}
    </>
  );
}
