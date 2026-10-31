import React, { useState } from 'react';
import { AuthUser } from '../types';
import { ShieldCheck, User, Sparkles, LogOut, LogIn, Lock, Menu, X } from 'lucide-react';

interface HeaderProps {
  currentUser: AuthUser | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  activeView: 'citizen' | 'wizard' | 'results' | 'admin' | 'review' | 'audit';
  onNavigate: (view: 'citizen' | 'wizard' | 'admin' | 'audit') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuthModal,
  onLogout,
  activeView,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isOfficerOrAdmin = currentUser?.role === 'reviewer' || currentUser?.role === 'admin';

  const handleNav = (view: 'citizen' | 'wizard' | 'admin' | 'audit') => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      {/* Tricolor hairline accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Wordmark */}
          <button
            onClick={() => handleNav('citizen')}
            className="flex items-center gap-3 text-left shrink-0 cursor-pointer group focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:outline-hidden rounded-lg p-1"
            aria-label="SAARTHI Home - Government Scheme Knowledge Platform"
          >
            <img
              src="/src/assets/images/schemes_service_emblem_1793040949562.jpg"
              alt=""
              className="w-10 h-10 object-contain rounded-full shadow-xs border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors whitespace-nowrap">
                SAARTHI
              </span>
              <span className="text-[10px] font-bold text-amber-800 tracking-wider uppercase whitespace-nowrap">
                Govt Scheme Knowledge Platform
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <button
              onClick={() => handleNav('citizen')}
              aria-current={activeView === 'citizen' ? 'page' : undefined}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap cursor-pointer py-1 px-1 focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:outline-hidden rounded ${
                activeView === 'citizen' ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-0.5' : ''
              }`}
            >
              Scheme Directory
            </button>
            <button
              onClick={() => handleNav('wizard')}
              aria-current={activeView === 'wizard' || activeView === 'results' ? 'page' : undefined}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 py-1 px-1 focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:outline-hidden rounded ${
                activeView === 'wizard' || activeView === 'results' ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-0.5' : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              Eligibility Wizard
            </button>
            <button
              onClick={() => handleNav('admin')}
              aria-current={activeView === 'admin' || activeView === 'review' ? 'page' : undefined}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 py-1 px-1 focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:outline-hidden rounded ${
                activeView === 'admin' || activeView === 'review' ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-0.5' : ''
              }`}
              title={isOfficerOrAdmin ? 'Verification & Review Studio' : 'Restricted: Reviewer / Admin access required'}
            >
              <span>Verification Studio</span>
              {!isOfficerOrAdmin && (
                <Lock className="w-3 h-3 text-slate-400" aria-label="Restricted access" />
              )}
            </button>
            <button
              onClick={() => handleNav('audit')}
              aria-current={activeView === 'audit' ? 'page' : undefined}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 py-1 px-1 focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:outline-hidden rounded ${
                activeView === 'audit' ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-0.5' : ''
              }`}
              title={isOfficerOrAdmin ? 'Audit Trail & Version History' : 'Restricted: Reviewer / Admin access required'}
            >
              <span>Audit Trail</span>
              {!isOfficerOrAdmin && (
                <Lock className="w-3 h-3 text-slate-400" aria-label="Restricted access" />
              )}
            </button>
          </nav>

          {/* User Account & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px]">
                    {currentUser.role === 'admin' && (
                      <span className="font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 rounded">
                        Dept Admin
                      </span>
                    )}
                    {currentUser.role === 'reviewer' && (
                      <span className="font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 rounded">
                        Officer
                      </span>
                    )}
                    {currentUser.role === 'citizen' && (
                      <span className="font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-1.5 rounded">
                        Citizen
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700">
                  {currentUser.role === 'admin' ? (
                    <Lock className="w-4 h-4 text-purple-700" aria-hidden="true" />
                  ) : currentUser.role === 'reviewer' ? (
                    <ShieldCheck className="w-4 h-4 text-amber-700" aria-hidden="true" />
                  ) : (
                    <User className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  )}
                </div>

                <button
                  onClick={onOpenAuthModal}
                  className="text-xs text-slate-700 hover:text-slate-900 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors cursor-pointer font-medium"
                  title="Switch account"
                >
                  Switch
                </button>

                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                Sign In
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav aria-label="Mobile Navigation" className="md:hidden border-t border-slate-200 py-3 px-2 flex flex-col gap-1 bg-white">
            <button
              onClick={() => handleNav('citizen')}
              className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeView === 'citizen' ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Scheme Directory
            </button>
            <button
              onClick={() => handleNav('wizard')}
              className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                activeView === 'wizard' || activeView === 'results' ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" aria-hidden="true" />
              Eligibility Wizard
            </button>
            <button
              onClick={() => handleNav('admin')}
              className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                activeView === 'admin' || activeView === 'review' ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Verification Studio</span>
              {!isOfficerOrAdmin && <Lock className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <button
              onClick={() => handleNav('audit')}
              className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                activeView === 'audit' ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Audit Trail</span>
              {!isOfficerOrAdmin && <Lock className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

