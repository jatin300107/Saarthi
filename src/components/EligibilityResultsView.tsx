import React, { useState } from 'react';
import { CitizenProfile, Scheme, SchemeEvaluationResult } from '../types';
import { ApiClient } from '../services/apiClient';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  FileCheck,
  CheckSquare,
  Square,
  HelpCircle,
  Bot,
} from 'lucide-react';

interface EligibilityResultsViewProps {
  profile: CitizenProfile;
  results: {
    eligible: SchemeEvaluationResult[];
    insufficient: SchemeEvaluationResult[];
    ineligible: SchemeEvaluationResult[];
  };
  onEditProfile: () => void;
  onSelectSchemeById: (schemeId: string) => void;
  onBackToDirectory: () => void;
  onOpenChat?: (schemeId: string) => void;
}

export const EligibilityResultsView: React.FC<EligibilityResultsViewProps> = ({
  profile,
  results,
  onEditProfile,
  onSelectSchemeById,
  onBackToDirectory,
  onOpenChat,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'eligible' | 'insufficient' | 'ineligible'>('eligible');
  const [explainingSchemeId, setExplainingSchemeId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [modelsUsed, setModelsUsed] = useState<Record<string, string>>({});
  const [preferredModel, setPreferredModel] = useState<string>('gemini-3.8-flash');
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const allResults = [
    ...results.eligible,
    ...results.insufficient,
    ...results.ineligible,
  ];

  const displayedResults =
    activeTab === 'all'
      ? allResults
      : activeTab === 'eligible'
      ? results.eligible
      : activeTab === 'insufficient'
      ? results.insufficient
      : results.ineligible;

  const toggleDoc = (docKey: string) => {
    setCheckedDocs((prev) => ({ ...prev, [docKey]: !prev[docKey] }));
  };

  const handleRequestExplanation = async (evalResult: SchemeEvaluationResult) => {
    setExplainingSchemeId(evalResult.schemeId);
    try {
      const res = await ApiClient.explainEligibility(evalResult.schemeId, profile, evalResult, preferredModel);
      setExplanations((prev) => ({ ...prev, [evalResult.schemeId]: res.explanation }));
      setModelsUsed((prev) => ({ ...prev, [evalResult.schemeId]: res.modelUsed }));
    } catch (err: any) {
      alert(`Could not generate plain explanation: ${err.message}`);
    } finally {
      setExplainingSchemeId(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation & Profile Summary Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDirectory}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Back to Schemes Directory"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Your Deterministic Eligibility Assessment
              </h1>
              <p className="text-xs text-slate-500">
                Statutory rule evaluation evaluated on server for: {profile.state} citizen · Age {profile.age || 'N/A'} · Income ₹{profile.annualIncome?.toLocaleString('en-IN') || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700">AI Model:</span>
              <select
                value={preferredModel}
                onChange={(e) => setPreferredModel(e.target.value)}
                className="py-1 px-2 text-xs bg-white border border-slate-300 rounded font-mono text-slate-900 focus:ring-2 focus:ring-blue-900"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended & Reliable)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Stable)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-low Latency)</option>
                <option value="gemini-flash-latest">gemini-flash-latest (Latest Release)</option>
              </select>
            </div>

            <button
              onClick={onEditProfile}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Adjust Profile Parameters
            </button>
          </div>
        </div>

        {/* 3-Tier Results KPI Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setActiveTab('eligible')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'eligible'
                ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Eligible Schemes
              </span>
              <span className="font-mono font-bold text-xl text-emerald-900 tabular-nums">
                {results.eligible.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              All statutory conditions verified. Ready for application.
            </p>
          </div>

          <div
            onClick={() => setActiveTab('insufficient')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'insufficient'
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Missing Profile Data
              </span>
              <span className="font-mono font-bold text-xl text-amber-900 tabular-nums">
                {results.insufficient.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Key verification criteria missing in profile.
            </p>
          </div>

          <div
            onClick={() => setActiveTab('ineligible')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'ineligible'
                ? 'bg-slate-200/80 border-slate-300 ring-2 ring-slate-400/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-slate-500" />
                Ineligible Schemes
              </span>
              <span className="font-mono font-bold text-xl text-slate-800 tabular-nums">
                {results.ineligible.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Statutory cap or eligibility condition not met.
            </p>
          </div>
        </div>
      </div>

      {/* Scheme Evaluation Cards */}
      <div className="space-y-6">
        {displayedResults.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">No schemes under this category.</p>
          </div>
        ) : (
          displayedResults.map((item) => {
            const hasExplanation = Boolean(explanations[item.schemeId]);
            const isExplaining = explainingSchemeId === item.schemeId;

            return (
              <div
                key={item.schemeId}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Scheme Header */}
                <div className="p-6 border-b border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Zero-Pill Metadata */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-blue-900">{item.sector}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.level}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.state}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono font-bold">{item.schemeCode}</span>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">
                        Rule Match Score: <strong className="tabular-nums text-slate-800">{item.confidenceScore}%</strong>
                      </span>
                      {item.status === 'eligible' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Eligible
                        </span>
                      )}
                      {item.status === 'insufficient_info' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          Requires More Details
                        </span>
                      )}
                      {item.status === 'ineligible' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
                          <XCircle className="w-3.5 h-3.5 text-slate-500" />
                          Ineligible
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {item.schemeTitle}
                  </h2>

                  {/* Benefits Kicker */}
                  {item.benefitsSummary.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide mb-1">
                        Tangible Scheme Benefits
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                        {item.benefitsSummary.map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Deterministic Rule Breakdown */}
                <div className="p-6 bg-slate-50/50 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Deterministic Statutory Verification:
                  </h3>

                  <div className="space-y-2">
                    {/* Passed rules */}
                    {item.passedRules.map((r) => (
                      <div
                        key={r.ruleId}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60 text-xs"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-emerald-950 block">{r.description}</span>
                          <span className="text-[11px] text-emerald-800">
                            Requirement: {r.expected} · Your Profile: {r.actual}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Failed rules */}
                    {item.failedRules.map((r) => (
                      <div
                        key={r.ruleId}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-50/60 border border-red-200 text-xs"
                      >
                        <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-red-950 block">{r.description}</span>
                          <span className="text-[11px] text-red-800">
                            Required Limit: {r.expected} · Your Value: {r.actual}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Missing rules */}
                    {item.missingRules.map((r) => (
                      <div
                        key={r.ruleId}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-amber-950 block">{r.description}</span>
                          <span className="text-[11px] text-amber-800">
                            Required: {r.expected} · Status: {r.actual}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Interactive Document Checklist (if eligible or pending) */}
                  {item.documentChecklist.length > 0 && item.status !== 'ineligible' && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-blue-900" />
                        Required Document Readiness Checklist:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.documentChecklist.map((doc) => {
                          const docKey = `${item.schemeId}_${doc.id}`;
                          const isChecked = Boolean(checkedDocs[docKey]);
                          return (
                            <button
                              key={doc.id}
                              onClick={() => toggleDoc(docKey)}
                              className={`flex items-start gap-2.5 p-2.5 text-left rounded-lg border text-xs transition-colors cursor-pointer ${
                                isChecked
                                  ? 'bg-blue-50/50 border-blue-200 text-blue-950'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-bold block">{doc.name}</span>
                                <span className="text-[11px] text-slate-500 block leading-tight">
                                  {doc.description}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Plain Language AI Explanation Drawer */}
                  {hasExplanation && (
                    <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-2">
                      <div className="flex items-center justify-between gap-2 font-bold text-blue-900">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>AI Plain-Language Advisory Summary:</span>
                        </div>
                        {modelsUsed[item.schemeId] && (
                          <span className="text-[10px] font-mono font-medium text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                            Model: {modelsUsed[item.schemeId]}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {explanations[item.schemeId]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {onOpenChat && (
                      <button
                        onClick={() => onOpenChat(item.schemeId)}
                        className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Bot className="w-4 h-4 text-slate-950" />
                        Chat with Scheme Assistant
                      </button>
                    )}
                    <button
                      onClick={() => handleRequestExplanation(item)}
                      disabled={isExplaining}
                      className="px-3.5 py-1.5 text-xs font-semibold text-blue-950 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      {isExplaining ? 'Generating Summary...' : hasExplanation ? 'Regenerate Plain Summary' : 'Explain in Plain Language'}
                    </button>
                    <button
                      onClick={() => onSelectSchemeById(item.schemeId)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      View Source Evidence & Gazette
                    </button>
                  </div>

                  <a
                    href={item.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    Apply on Official Portal
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
