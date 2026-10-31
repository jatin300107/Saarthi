import React from 'react';
import { AuthUser } from '../types';
import { ShieldCheck, Lock } from 'lucide-react';

interface RoleBannerProps {
  currentUser: AuthUser | null;
  onOpenAuthModal: () => void;
}

export const RoleBanner: React.FC<RoleBannerProps> = ({ currentUser }) => {
  // Public citizens do not need an intrusive banner or technical RBAC claims
  if (!currentUser || currentUser.role === 'citizen') {
    return null;
  }

  if (currentUser.role === 'reviewer') {
    return (
      <aside
        aria-label="Officer Session Notice"
        className="bg-amber-50 border-b border-amber-200/80 py-2 px-4 text-xs text-amber-950"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-amber-950">Verification Officer Session:</span>
            <span>
              {currentUser.name} ({currentUser.designation || 'Verification Officer'})
            </span>
          </div>
          <span className="text-[11px] font-medium text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
            Reviewer Mode Active
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Administrator Session Notice"
      className="bg-slate-900 text-slate-100 border-b border-slate-800 py-2 px-4 text-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-400 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-white">Department Administrator Session:</span>
          <span>
            {currentUser.name} ({currentUser.designation || 'System Admin'})
          </span>
        </div>
        <span className="text-[11px] font-medium text-purple-200 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700">
          Admin Mode Active
        </span>
      </div>
    </aside>
  );
};

