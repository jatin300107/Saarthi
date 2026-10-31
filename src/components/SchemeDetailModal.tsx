import React, { useState } from 'react';
import { Scheme, SchemeVersion } from '../types';
import {
  X,
  Building2,
  CheckCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  History,
  AlertTriangle,
  Phone,
  Bookmark,
  Bot,
} from 'lucide-react';

interface SchemeDetailModalProps {
  scheme: Scheme | null;
  versions?: SchemeVersion[];
  isOpen: boolean;
  onClose: () => void;
  onOpenWizardForScheme?: (scheme: Scheme) => void;
  onOpenChat?: (scheme: Scheme) => void;
}

export const SchemeDetailModal: React.FC<SchemeDetailModalProps> = ({
  scheme,
  versions = [],
  isOpen,
  onClose,
  onOpenWizardForScheme,
  onOpenChat,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'eligibility' | 'evidence' | 'versions'>('overview');

  if (!isOpen || !scheme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            {scheme.isDemo && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                <AlertTriangle className="w-3.5 h-3.5" />
                SYNTHETIC TESTING DEMO RECORD
              </span>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-amber-400 font-semibold">{scheme.sector}</span>
              <span aria-hidden="true">·</span>
              <span>{scheme.level} Scheme</span>
              <span aria-hidden="true">·</span>
              <span>{scheme.state}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-bold text-white">Version {scheme.version}.0</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              {scheme.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tab Controls */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50 gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Scheme Overview & Benefits' },
            { id: 'eligibility', label: 'Eligibility Rules & Documents' },
            { id: 'evidence', label: 'Gazette Evidence & Source Citations' },
            { id: 'versions', label: `Version History (${versions.length || scheme.version})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Detailed Overview */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Official Mandate & Objective
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {scheme.detailedOverview || scheme.shortDescription}
                </p>
              </div>

              {/* Financial Entitlement Box */}
              {scheme.financialAssistance && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    Statutory Financial Entitlement
                  </span>
                  <p className="text-sm font-semibold">{scheme.financialAssistance}</p>
                </div>
              )}

              {/* Tangible Benefits */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Entitlements & Tangible Services
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {scheme.benefits.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Procedure Steps */}
              {scheme.applicationProcedure.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Official Application Modality
                  </h3>
                  <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {scheme.applicationProcedure.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Nodal Governance info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Nodal Ministry</span>
                  <span className="font-semibold text-slate-800">{scheme.ministry}</span>
                </div>
                {scheme.portalHelpline && (
                  <div>
                    <span className="text-slate-400 block">Citizen Helpline</span>
                    <span className="font-mono font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-blue-900" />
                      {scheme.portalHelpline}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'eligibility' && (
            <div className="space-y-6">
              {/* Statutory Rules Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Statutory Eligibility Constraints
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Field</th>
                        <th className="py-2.5 px-3">Operator</th>
                        <th className="py-2.5 px-3">Value</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Mandatory</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {scheme.rules.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-800">{r.field}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{r.operator}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                            {Array.isArray(r.value) ? r.value.join(', ') : String(r.value)}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{r.description}</td>
                          <td className="py-2 px-3">
                            {r.mandatory ? (
                              <span className="text-red-700 font-semibold">Strict</span>
                            ) : (
                              <span className="text-slate-400">Optional</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exclusion Categories */}
              {scheme.exclusions.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-red-700 mb-2">
                    Disqualifications & Exclusions
                  </h3>
                  <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 space-y-1.5 text-xs text-red-950">
                    {scheme.exclusions.map((ex, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                        <span>{ex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Required Documents */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Statutory Documentation Readiness
                </h3>
                <div className="space-y-2">
                  {scheme.requiredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{doc.name}</span>
                        <span className="text-slate-600">{doc.description}</span>
                        {doc.issuingAuthority && (
                          <span className="text-[11px] text-slate-400 block">
                            Issuing Authority: {doc.issuingAuthority}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                        {doc.mandatory ? 'Mandatory' : 'Optional / Category-based'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {scheme.sourceEvidence ? (
                <div className="space-y-4">
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <span>Verified Gazette Citation & Legal Grounding</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                      <div>
                        <span className="text-slate-500 block">Source Document</span>
                        <span className="font-bold text-slate-900">{scheme.sourceEvidence.documentTitle}</span>
                      </div>
                      {scheme.sourceEvidence.gazetteNumber && (
                        <div>
                          <span className="text-slate-500 block">Gazette Notification ID</span>
                          <span className="font-mono font-bold text-slate-900">
                            {scheme.sourceEvidence.gazetteNumber}
                          </span>
                        </div>
                      )}
                      {scheme.sourceEvidence.gazetteDate && (
                        <div>
                          <span className="text-slate-500 block">Notification Date</span>
                          <span className="font-mono text-slate-900">{scheme.sourceEvidence.gazetteDate}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 block">Referenced Pages</span>
                        <span className="font-mono font-bold text-slate-900">
                          Pages {scheme.sourceEvidence.pageReferences.join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* Verbatim snippet */}
                    <div className="mt-3 pt-3 border-t border-blue-200/80">
                      <span className="text-xs font-semibold text-slate-600 block mb-1">
                        Verbatim Gazette Clause Excerpt:
                      </span>
                      <blockquote className="bg-white p-3 rounded-lg border border-blue-100 text-xs text-slate-800 italic leading-relaxed font-serif">
                        "{scheme.sourceEvidence.extractedParagraphSnippet}"
                      </blockquote>
                    </div>

                    {scheme.approvedBy && (
                      <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Statutorily approved by: {scheme.approvedBy} on {scheme.approvedAt ? new Date(scheme.approvedAt).toLocaleDateString() : 'Baseline'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Source citation details recorded during baseline ingestion.
                </div>
              )}
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tamper-Evident Version Audit Trail
              </h3>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {versions.map((ver) => (
                  <div key={ver.version} className="p-4 bg-white hover:bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">Version {ver.version}.0</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {new Date(ver.updatedAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-slate-700">{ver.changeSummary}</p>
                    <span className="text-[11px] text-slate-400 block">Author: {ver.updatedBy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {onOpenWizardForScheme && (
              <button
                onClick={() => {
                  onClose();
                  onOpenWizardForScheme(scheme);
                }}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                Test My Eligibility for This Scheme
              </button>
            )}

            {onOpenChat && (
              <button
                onClick={() => {
                  onOpenChat(scheme);
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Bot className="w-4 h-4 text-slate-950" />
                Chat with Scheme Assistant
              </button>
            )}
          </div>

          <a
            href={scheme.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            Visit Official Govt Portal
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
