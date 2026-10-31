import React, { useState } from 'react';
import { Scheme, SchemeSector } from '../types';
import { Search, Sparkles, Building2, CheckCircle, FileText, ExternalLink, ArrowRight, AlertTriangle, Bot, X } from 'lucide-react';

interface CitizenPortalProps {
  schemes: Scheme[];
  loading: boolean;
  onSelectScheme: (scheme: Scheme) => void;
  onOpenWizard: () => void;
  selectedSector: SchemeSector | 'All';
  onSectorChange: (sector: SchemeSector | 'All') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedState: string;
  onStateChange: (state: string) => void;
  onOpenChat?: (scheme: Scheme) => void;
}

const INDIAN_STATES = [
  'All India',
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
];

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  schemes,
  loading,
  onSelectScheme,
  onOpenWizard,
  selectedSector,
  onSectorChange,
  searchQuery,
  onSearchChange,
  selectedState,
  onStateChange,
  onOpenChat,
}) => {
  const [filterLevel, setFilterLevel] = useState<'All' | 'Central' | 'State'>('All');

  const filteredSchemes = schemes.filter((s) => {
    if (selectedSector !== 'All' && s.sector !== selectedSector) return false;
    if (filterLevel !== 'All' && s.level !== filterLevel) return false;
    if (selectedState !== 'All India' && s.state !== 'All India' && s.state.toLowerCase() !== selectedState.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchText = `${s.title} ${s.code} ${s.shortDescription} ${s.ministry} ${s.benefits.join(' ')}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Clean Civic Hero Section */}
      <section
        aria-labelledby="portal-hero-heading"
        className="relative overflow-hidden bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800"
      >
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/src/assets/images/hero_civic_india_1793040950625.jpg"
            alt=""
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/80" />
        </div>

        <div className="relative max-w-3xl px-6 py-10 sm:py-14 sm:px-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-amber-300 mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
            <span>National Government Schemes Portal</span>
          </div>

          <h1
            id="portal-hero-heading"
            className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-4 leading-tight"
          >
            Find government welfare schemes you are eligible for
          </h1>

          <p className="text-slate-200 text-sm sm:text-base mb-7 leading-relaxed max-w-2xl">
            Explore central and state welfare initiatives across agriculture, healthcare, education, and entrepreneurship. Evaluate your statutory eligibility, verify required documents, and access official application channels.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenWizard}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-hidden text-slate-950 font-bold text-sm rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" aria-hidden="true" />
              <span>Check Eligibility (2-Min Profile)</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <a
              href="#catalog"
              className="px-4 py-3 bg-white/10 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-hidden text-white font-semibold text-sm rounded-lg transition-colors border border-white/20"
            >
              Browse Catalog ({schemes.length} Schemes)
            </a>
          </div>
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <section
        id="catalog"
        aria-label="Scheme search and filters"
        className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <label htmlFor="scheme-search-input" className="sr-only">
              Search government schemes by title, keywords, or benefits
            </label>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              id="scheme-search-input"
              type="text"
              placeholder="Search by scheme name, benefits (e.g. ₹6000, subsidy), ministry, or keyword..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                aria-label="Clear search text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* State selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="state-select" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                State:
              </label>
              <select
                id="state-select"
                value={selectedState}
                onChange={(e) => onStateChange(e.target.value)}
                className="py-2 px-3 text-xs sm:text-sm bg-slate-50 text-slate-800 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900 cursor-pointer"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Segmented control */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200" role="group" aria-label="Scheme jurisdiction level">
              {(['All', 'Central', 'State'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  aria-pressed={filterLevel === lvl}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    filterLevel === lvl
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sector Filter Chips & Result Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Scheme sector categories">
            <span className="text-xs font-semibold text-slate-700 mr-1 whitespace-nowrap">Sector:</span>
            {(['All', 'Agriculture', 'Healthcare', 'Education', 'MSME', 'Social Welfare'] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => onSectorChange(sec)}
                aria-pressed={selectedSector === sec}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  selectedSector === sec
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          <div role="status" aria-live="polite" className="text-xs font-medium text-slate-600 whitespace-nowrap">
            Showing <strong className="text-slate-900">{filteredSchemes.length}</strong> of {schemes.length} schemes
          </div>
        </div>
      </section>

      {/* Scheme Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-4/5" />
              <div className="h-16 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" aria-hidden="true" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No schemes match your filter criteria</h3>
          <p className="text-sm text-slate-600 mb-6">
            Try adjusting your search keywords, resident state, or sector filters to view available government schemes.
          </p>
          <button
            onClick={() => {
              onSectorChange('All');
              onSearchChange('');
              onStateChange('All India');
              setFilterLevel('All');
            }}
            className="px-4 py-2 bg-blue-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => (
            <article
              key={scheme.id}
              className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                scheme.isDemo
                  ? 'border-amber-300 bg-amber-50/10 hover:shadow-md'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div className="p-6 space-y-4">
                {/* Clear demo label if synthetic */}
                {scheme.isDemo && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-md border border-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
                    <span>Sample Demo Record</span>
                  </div>
                )}

                {/* Metadata Line */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="text-blue-900 font-bold">{scheme.sector}</span>
                  <span aria-hidden="true">·</span>
                  <span>{scheme.level}</span>
                  <span aria-hidden="true">·</span>
                  <span>{scheme.state}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-700 font-semibold">{scheme.code}</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  <button
                    onClick={() => onSelectScheme(scheme)}
                    className="text-left hover:text-blue-900 transition-colors cursor-pointer"
                  >
                    {scheme.title}
                  </button>
                </h3>

                {/* Financial Benefit highlight */}
                {scheme.financialAssistance && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-950">
                    <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wide">
                      Financial Entitlement
                    </span>
                    <span className="font-medium text-emerald-900 mt-0.5 block">{scheme.financialAssistance}</span>
                  </div>
                )}

                {/* Short Description */}
                <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">
                  {scheme.shortDescription}
                </p>

                {/* Ministry */}
                <div className="flex items-start gap-2 text-xs text-slate-600 pt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">{scheme.ministry}</span>
                </div>

                {/* Key Eligibility Rules */}
                <div className="space-y-1.5 text-xs text-slate-700">
                  <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wide">
                    Key Eligibility Rules:
                  </span>
                  {scheme.rules.slice(0, 2).map((r) => (
                    <div key={r.id} className="flex items-start gap-1.5 text-slate-700">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
                      <span className="line-clamp-1">{r.description}</span>
                    </div>
                  ))}
                  {scheme.rules.length > 2 && (
                    <span className="text-[11px] text-slate-500 italic block">
                      + {scheme.rules.length - 2} more eligibility conditions
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 rounded-b-xl flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectScheme(scheme)}
                    className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    View Details
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </button>

                  {onOpenChat && (
                    <button
                      onClick={() => onOpenChat(scheme)}
                      aria-label={`Ask AI Assistant about ${scheme.title}`}
                      className="px-2.5 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5 text-slate-950" aria-hidden="true" />
                      Ask AI
                    </button>
                  )}
                </div>

                <a
                  href={scheme.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Official portal for ${scheme.title} (opens in new tab)`}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
                >
                  Official Portal
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

