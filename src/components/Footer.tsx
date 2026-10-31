import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <span>SAARTHI · Government Scheme Knowledge Platform</span>
            </div>
            <p className="text-slate-400 text-xs max-w-xl">
              An accessible public service platform providing verified information on government welfare schemes, statutory eligibility criteria, and official application portals.
            </p>
          </div>

          <nav aria-label="Official Government Links" className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
            <a
              href="https://www.india.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden rounded py-0.5"
            >
              National Portal of India
              <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden="true" />
            </a>
            <a
              href="https://mygov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden rounded py-0.5"
            >
              MyGov India
              <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden="true" />
            </a>
            <a
              href="https://digitalindia.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden rounded py-0.5"
            >
              Digital India
              <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden="true" />
            </a>
          </nav>
        </div>

        {/* Advisory disclaimer */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <span className="font-semibold text-slate-200 block uppercase tracking-wide">
            Public Information Notice
          </span>
          <p className="leading-relaxed">
            Eligibility assessments are computed using verified rules from officially published notifications. For complete legal provisions and application submissions, citizens are advised to visit the respective ministry or department official portals.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <span>SAARTHI · Unified Citizen Scheme Engine</span>
          <span>Aligned with National e-Governance Standards (NeGD)</span>
        </div>
      </div>
    </footer>
  );
};

