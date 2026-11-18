import React, { useState } from 'react';
import { BookOpen, BarChart2, History, Menu, X, LogOut, User, Cloud, RefreshCw, AlertCircle, WifiOff } from 'lucide-react';
import { NavPage } from '../types';
import { useAuth } from '../AuthContext';
import { useApp } from '../AppContext';

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

  const SyncBadge = () => {
    if (!user) return null;
    return (
      <div className="px-3 py-1.5 mx-3 mb-2 rounded-xl text-[11px] font-medium flex items-center justify-between border"
        style={
          syncStatus === 'synced'
            ? { background: '#F0FDF4', borderColor: '#BBF7D0', color: '#16A34A' }
            : syncStatus === 'syncing'
              ? { background: '#EFF6FF', borderColor: '#BFDBFE', color: '#2563EB' }
              : syncStatus === 'offline'
                ? { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#64748B' }
                : { background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }
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
          className="p-1 rounded hover:bg-black/5"
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
          style={currentPage === item.id
            ? { background: '#DBEAFE', borderColor: '#BFDBFE', color: '#1D4ED8' }
            : { background: 'transparent', borderColor: 'transparent', color: '#64748B' }}
          onMouseEnter={e => {
            if (currentPage !== item.id) {
              (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
            }
          }}
          onMouseLeave={e => {
            if (currentPage !== item.id) {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
            }
          }}
        >
          <span style={{ color: currentPage === item.id ? '#2563EB' : '#94A3B8' }}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );

  const UserFooter = () => (
    <div className="px-4 py-4 border-t" style={{ borderColor: '#E2E8F0' }}>
      {user ? (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
            style={{ background: '#DBEAFE', borderColor: '#BFDBFE' }}>
            <User size={14} style={{ color: '#2563EB' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" style={{ color: '#1E293B' }} title={user.email}>
              {user.email}
            </p>
            <p className="text-[10px]" style={{ color: '#64748B' }}>SSC CGL Prep</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out of account"
            className="p-1.5 rounded-xl border transition-colors shrink-0"
            style={{ background: '#F8FAFC', borderColor: '#E2E8F0', color: '#64748B' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#FEF2F2';
              e.currentTarget.style.borderColor = '#FECACA';
              e.currentTarget.style.color = '#DC2626';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#F8FAFC';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.color = '#64748B';
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      ) : (
        <p className="text-xs" style={{ color: '#94A3B8' }}>SSC CGL Prep</p>
      )}
    </div>
  );

  const Logo = () => (
    <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: '#E2E8F0' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: '#2563EB' }}>
        <BookOpen size={15} className="text-white" />
      </div>
      <div>
        <span className="font-bold text-base block leading-tight" style={{ color: '#1E293B' }}>Study Tracker</span>
        <span className="text-[10px] font-semibold tracking-wider uppercase block" style={{ color: '#2563EB' }}>SSC CGL</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen fixed left-0 top-0 z-30 bg-white border-r" style={{ borderColor: '#E2E8F0' }}>
        <Logo />
        <NavLinks />
        <SyncBadge />
        <UserFooter />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b flex items-center justify-between px-4 py-3" style={{ borderColor: '#E2E8F0' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: '#2563EB' }}>
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-bold text-base" style={{ color: '#1E293B' }}>Study Tracker</span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: syncStatus === 'synced' ? '#16A34A' : syncStatus === 'syncing' ? '#2563EB' : '#DC2626' }}
              title={`Status: ${syncStatus}`}
            />
          )}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="p-2 rounded-lg border"
            style={{ background: '#F8FAFC', borderColor: '#E2E8F0', color: '#64748B' }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div className="w-64 bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
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
