import React, { useState } from 'react';
import {
  BookOpen, BarChart2, History, Menu, X, LogOut, User,
  Sun, Moon
} from 'lucide-react';
import { NavPage } from '../types';
import { useAuth } from '../AuthContext';
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
            <UserFooter />
          </div>
        </div>
      )}
    </>
  );
}
