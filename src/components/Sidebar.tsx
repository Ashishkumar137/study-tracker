import React, { useState } from 'react';
import { BookOpen, BarChart2, History, Menu, X, LogOut, User } from 'lucide-react';
import { NavPage } from '../types';
import { useAuth } from '../AuthContext';

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

  const NavLinks = () => (
    <nav className="flex-1 py-3 px-3">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all"
          style={currentPage === item.id
            ? { background: '#DBEAFE', color: '#2563EB' }
            : { background: 'transparent', color: '#64748B' }}
          onMouseEnter={e => { if (currentPage !== item.id) (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC'; }}
          onMouseLeave={e => { if (currentPage !== item.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <span style={{ color: currentPage === item.id ? '#2563EB' : '#94a3b8' }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );

  const UserFooter = () => (
    <div className="px-4 py-4 border-t" style={{ borderColor: '#E2E8F0' }}>
      {user ? (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#DBEAFE' }}>
            <User size={13} style={{ color: '#2563EB' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" style={{ color: '#1E293B' }}>{user.email}</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>SSC CGL Prep</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="p-1.5 rounded-lg transition-colors shrink-0"
            style={{ color: '#94a3b8' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <p className="text-xs" style={{ color: '#94a3b8' }}>SSC CGL Prep</p>
      )}
    </div>
  );

  const Logo = () => (
    <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: '#E2E8F0' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#2563EB' }}>
        <BookOpen size={15} className="text-white" />
      </div>
      <span className="font-bold text-base" style={{ color: '#1E293B' }}>Study Tracker</span>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen fixed left-0 top-0 z-30 bg-white border-r" style={{ borderColor: '#E2E8F0' }}>
        <Logo />
        <NavLinks />
        <UserFooter />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b flex items-center justify-between px-4 py-3" style={{ borderColor: '#E2E8F0' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#2563EB' }}>
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-bold text-base" style={{ color: '#1E293B' }}>Study Tracker</span>
        </div>
        <button onClick={() => setMobileOpen(v => !v)} className="p-2 rounded-lg" style={{ color: '#64748B' }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div className="w-56 bg-white h-full shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <Logo />
            <NavLinks />
            <UserFooter />
          </div>
        </div>
      )}
    </>
  );
}
