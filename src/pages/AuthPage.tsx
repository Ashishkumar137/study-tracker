import React, { useState } from 'react';
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: '#F8FAFC' }}>
      <div className="w-full max-w-sm">
        {/* App Logo & Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-sm" style={{ background: '#2563EB' }}>
            <BookOpen size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#1E293B' }}>Study Tracker</h1>
          <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: '#2563EB' }}>
            Attendance & Productivity Dashboard
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#E2E8F0' }}>
          {/* Light Tab Switcher */}
          <div className="flex rounded-xl p-1 mb-5 border" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
            {(['login', 'signup'] as AuthMode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setSuccessMsg(''); }}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all border"
                style={mode === m
                  ? { background: '#DBEAFE', borderColor: '#BFDBFE', color: '#1D4ED8' }
                  : { background: 'transparent', borderColor: 'transparent', color: '#64748B' }}
              >
                {m === 'login' ? 'Log In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#64748B' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all border"
                  style={{ borderColor: '#E2E8F0', color: '#1E293B', background: '#FFFFFF' }}
                  onFocus={e => (e.target.style.borderColor = '#2563EB')}
                  onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#64748B' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all border"
                  style={{ borderColor: '#E2E8F0', color: '#1E293B', background: '#FFFFFF' }}
                  onFocus={e => (e.target.style.borderColor = '#2563EB')}
                  onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: '#94A3B8' }}
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
                style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div
                className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs border"
                style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#16A34A' }}
              >
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Light Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold border transition-all mt-2 flex items-center justify-center gap-2"
              style={{
                background: '#DBEAFE',
                borderColor: '#BFDBFE',
                color: '#1D4ED8',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => {
                if (!loading) e.currentTarget.style.background = '#BFDBFE';
              }}
              onMouseLeave={e => {
                if (!loading) e.currentTarget.style.background = '#DBEAFE';
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

        <p className="text-center text-xs mt-4" style={{ color: '#94A3B8' }}>
          Protected by Supabase Row Level Security (RLS).<br />
          Your study records remain strictly private.
        </p>
      </div>
    </div>
  );
}
