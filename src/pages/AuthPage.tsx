import React, { useState } from 'react';
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Sun, Moon } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    if (mode === 'login') {
      const err = await signIn(trimmedEmail, password);
      if (err) setError(err);
    } else {
      const err = await signUp(trimmedEmail, password);
      if (err) {
        setError(err);
      } else {
        setSuccessMsg('Account created! Please check your email to verify (or log in directly if confirmation is disabled in Supabase).');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative transition-colors duration-200" style={{ background: 'var(--bg-app)' }}>
      {/* Theme Toggle in top-right */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold shadow-sm"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)',
        }}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
        <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
      </button>

      <div className="w-full max-w-sm">
        {/* App Logo & Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-sm" style={{ background: '#2563EB' }}>
            <BookOpen size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>Study Tracker</h1>
          <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: '#3B82F6' }}>
            Attendance & Productivity Dashboard
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl shadow-sm border p-6 transition-colors duration-200" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          {/* Light/Dark Tab Switcher */}
          <div className="flex rounded-xl p-1 mb-5 border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
            {(['login', 'signup'] as AuthMode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setSuccessMsg(''); }}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all border"
                style={mode === m
                  ? { background: 'var(--badge-bg)', borderColor: 'var(--badge-border)', color: 'var(--badge-text)' }
                  : { background: 'transparent', borderColor: 'transparent', color: 'var(--text-secondary)' }}
              >
                {m === 'login' ? 'Log In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all border"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                  onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all border"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                  onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--text-muted)' }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs border"
                style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#EF4444' }}
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div
                className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs border"
                style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.25)', color: '#22C55E' }}
              >
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold border transition-all mt-2 flex items-center justify-center gap-2"
              style={{
                background: 'var(--badge-bg)',
                borderColor: 'var(--badge-border)',
                color: 'var(--badge-text)',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              <span>
                {loading
                  ? 'Connecting to cloud...'
                  : mode === 'login'
                    ? 'Log In to Tracker'
                    : 'Create New Account'}
              </span>
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          Protected by Supabase Row Level Security (RLS).<br />
          Your study records remain strictly private.
        </p>
      </div>
    </div>
  );
}
