import React, { useState, useEffect } from 'react';
import { BookOpen, BarChart2, History, Menu, X } from 'lucide-react';
import { NavPage } from '../types';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}

const navItems: { id: NavPage; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <BookOpen size={20} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
  { id: 'history', label: 'History', icon: <History size={20} /> },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on page change
  useEffect(() => { setMobileOpen(false); }, [currentPage]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-30">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Study Tracker</span>
        </div>
        <nav className="flex-1 py-4 px-3">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors
                ${currentPage === item.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <span className={currentPage === item.id ? 'text-indigo-600' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">SSC CGL Prep</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-base">Study Tracker</span>
        </div>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-50"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div className="w-56 bg-white h-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg">Study Tracker</span>
            </div>
            <nav className="py-4 px-3">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors
                    ${currentPage === item.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <span className={currentPage === item.id ? 'text-indigo-600' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
