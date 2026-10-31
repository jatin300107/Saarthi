import React, { useState } from 'react';
import { AuthUser } from '../types';
import { ApiClient } from '../services/apiClient';
import { ShieldCheck, UserCheck, Lock, Mail, User, X, AlertCircle, Sparkles, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await ApiClient.login(loginEmail, loginPassword);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await ApiClient.register(regName, regEmail, regPassword);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check input.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await ApiClient.login(email, pass);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(`Demo login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">SAARTHI Portal Access</h2>
              <p className="text-xs text-blue-200">Official Government Knowledge & Scheme Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === 'login'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Official Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); }}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === 'register'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Citizen Registration
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="officer@saarthi.gov.in or citizen@domain.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secure Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Authenticating...' : 'Sign In with Verified Credentials'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 leading-relaxed">
                Self-registration grants verified <strong>Citizen Access</strong> to browse approved schemes, execute deterministic eligibility checks, and access grounded AI assistants.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ramesh.kumar@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Creating Account...' : 'Register as Citizen'}
              </button>
            </form>
          )}

          {/* Explicit Development / Evaluation Quick Access */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>QA & Evaluation Demo Credentials</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2.5 leading-normal">
              Quickly test role-based access control with pre-seeded server accounts. Each button authenticates through <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[10px]">/api/auth/login</code> and receives a cryptographic Bearer JWT.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('citizen@saarthi.gov.in', 'CitizenPassword@123')}
                disabled={loading}
                className="p-2 border border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-900">
                  <UserCheck className="w-3 h-3 text-blue-700 shrink-0" />
                  <span>Citizen</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Ramesh Kumar</div>
                <div className="text-[9px] text-blue-700 font-mono mt-0.5 font-medium">Public Access</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('reviewer@saarthi.gov.in', 'ReviewerPassword@123')}
                disabled={loading}
                className="p-2 border border-amber-200 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-50 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900">
                  <ShieldCheck className="w-3 h-3 text-amber-700 shrink-0" />
                  <span>Reviewer</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Dr. S. Kulkarni</div>
                <div className="text-[9px] text-amber-800 font-mono mt-0.5 font-medium">Verification Off.</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@saarthi.gov.in', 'AdminPassword@123')}
                disabled={loading}
                className="p-2 border border-slate-300 hover:border-slate-500 bg-slate-100/70 hover:bg-slate-100 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900">
                  <Lock className="w-3 h-3 text-slate-700 shrink-0" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Sh. R. Verma</div>
                <div className="text-[9px] text-slate-800 font-mono mt-0.5 font-medium">Dept. Lead</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
