import React, { useState } from 'react';
import { IngestedDocument, Scheme, EligibilityRule, DocumentRequirement } from '../types';
import {
  ShieldCheck,
  Check,
  X,
  FileText,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Eye,
  CheckCircle,
} from 'lucide-react';

interface DocumentReviewStudioProps {
  scheme: Scheme;
  document?: IngestedDocument;
  onApprove: (schemeId: string) => Promise<void>;
  onReject: (schemeId: string, reason: string) => Promise<void>;
  onSaveUpdates: (schemeId: string, updates: Partial<Scheme>) => Promise<void>;
  onBack: () => void;
  loading: boolean;
}

export const DocumentReviewStudio: React.FC<DocumentReviewStudioProps> = ({
  scheme,
  document,
  onApprove,
  onReject,
  onSaveUpdates,
  onBack,
  loading,
}) => {
  const [formData, setFormData] = useState<Scheme>({ ...scheme });
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activePage, setActivePage] = useState<number>(1);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFieldChange = (field: keyof Scheme, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRuleChange = (index: number, ruleField: keyof EligibilityRule, value: any) => {
    const updated = [...formData.rules];
    updated[index] = { ...updated[index], [ruleField]: value };
    setFormData((prev) => ({ ...prev, rules: updated }));
  };

  const addRule = () => {
    const newRule: EligibilityRule = {
      id: `rule_manual_${Date.now()}`,
      field: 'annualIncome',
      operator: 'less_than_or_equal',
      value: 300000,
      description: 'Annual family income must not exceed limit',
      mandatory: true,
    };
    setFormData((prev) => ({ ...prev, rules: [...prev.rules, newRule] }));
  };

  const removeRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleDocReqChange = (index: number, field: keyof DocumentRequirement, value: any) => {
    const updated = [...formData.requiredDocuments];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, requiredDocuments: updated }));
  };

  const addDocReq = () => {
    const newDoc: DocumentRequirement = {
      id: `doc_manual_${Date.now()}`,
      name: 'New Required Document',
      description: 'Proof of statutory eligibility',
      mandatory: true,
      issuingAuthority: 'Competent Authority',
    };
    setFormData((prev) => ({
      ...prev,
      requiredDocuments: [...prev.requiredDocuments, newDoc],
    }));
  };

  const removeDocReq = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    await onSaveUpdates(scheme.id, formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Studio Header Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Regulatory Verification Studio
              </h1>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                formData.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : formData.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {formData.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Human-in-the-Loop review of AI-extracted fields against source document evidence
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-600" />
            {saveSuccess ? 'Saved!' : 'Save Draft Changes'}
          </button>

          {formData.status !== 'approved' && (
            <button
              onClick={() => onApprove(scheme.id)}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Approve for Citizen Portal
            </button>
          )}

          {formData.status !== 'rejected' && (
            <button
              onClick={() => setRejectModalOpen(true)}
              disabled={loading}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-lg border border-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              Reject Draft
            </button>
          )}
        </div>
      </div>

      {/* Side-by-Side Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Source Evidence & Extracted Text (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-900" />
              Source Gazette Document Evidence
            </span>
            {document && (
              <span className="text-[11px] font-mono text-slate-500">
                {document.pageCount} Pages Ingested
              </span>
            )}
          </div>

          {document ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <span className="font-bold text-slate-900 block">{document.filename}</span>
                <span className="text-slate-500 block">
                  Uploaded: {new Date(document.uploadedAt).toLocaleString('en-IN')} by {document.uploadedBy}
                </span>
                {document.gazetteNumber && (
                  <span className="font-mono text-slate-700 block">Gazette ID: {document.gazetteNumber}</span>
                )}
              </div>

              {/* Page selector */}
              {document.pageTexts && document.pageTexts.length > 1 && (
                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  <span className="text-xs text-slate-500 mr-1 shrink-0">Page:</span>
                  {document.pageTexts.map((pt) => (
                    <button
                      key={pt.page}
                      onClick={() => setActivePage(pt.page)}
                      className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer shrink-0 ${
                        activePage === pt.page
                          ? 'bg-blue-900 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      P.{pt.page}
                    </button>
                  ))}
                </div>
              )}

              {/* Extracted raw page text */}
              <div className="bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-lg h-[460px] overflow-y-auto leading-relaxed border border-slate-800 whitespace-pre-wrap selection:bg-amber-500 selection:text-slate-950">
                {document.pageTexts?.find((pt) => pt.page === activePage)?.text || document.extractedText}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {scheme.sourceEvidence ? (
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-2">
                  <span className="font-bold text-blue-950 block">Baseline Gazette Reference:</span>
                  <p className="text-slate-800">{scheme.sourceEvidence.documentTitle}</p>
                  <blockquote className="bg-white p-3 rounded border border-blue-100 italic text-slate-700 font-serif">
                    "{scheme.sourceEvidence.extractedParagraphSnippet}"
                  </blockquote>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No linked binary document file uploaded.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Editable Schema Fields (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Scheme Data Fields
            </span>
            <span className="text-xs text-slate-500">Edit fields to correct OCR or refine rules</span>
          </div>

          {/* Core metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Scheme Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleFieldChange('code', e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sector</label>
              <select
                value={formData.sector}
                onChange={(e) => handleFieldChange('sector', e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              >
                <option value="Agriculture">Agriculture</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="MSME">MSME</option>
                <option value="Social Welfare">Social Welfare</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Official Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Level</label>
              <select
                value={formData.level}
                onChange={(e) => handleFieldChange('level', e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              >
                <option value="Central">Central Scheme</option>
                <option value="State">State Scheme</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Applicable State / UT</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nodal Ministry / Department</label>
            <input
              type="text"
              value={formData.ministry}
              onChange={(e) => handleFieldChange('ministry', e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Citizen Short Description</label>
            <textarea
              rows={2}
              value={formData.shortDescription}
              onChange={(e) => handleFieldChange('shortDescription', e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Financial Assistance Details</label>
            <input
              type="text"
              value={formData.financialAssistance || ''}
              onChange={(e) => handleFieldChange('financialAssistance', e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              placeholder="e.g. ₹6,000 per year via DBT"
            />
          </div>

          {/* Editable Eligibility Rules Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Deterministic Eligibility Constraints ({formData.rules.length})
              </span>
              <button
                type="button"
                onClick={addRule}
                className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-900 rounded border border-blue-200 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Condition
              </button>
            </div>

            <div className="space-y-3">
              {formData.rules.map((rule, idx) => (
                <div key={rule.id || idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      <select
                        value={rule.field}
                        onChange={(e) => handleRuleChange(idx, 'field', e.target.value)}
                        className="py-1 px-2 text-xs bg-white border border-slate-300 rounded font-mono"
                      >
                        <option value="age">age</option>
                        <option value="annualIncome">annualIncome</option>
                        <option value="occupation">occupation</option>
                        <option value="gender">gender</option>
                        <option value="socialCategory">socialCategory</option>
                        <option value="landHoldingHectares">landHoldingHectares</option>
                        <option value="isBplCardHolder">isBplCardHolder</option>
                        <option value="isDifferentlyAbled">isDifferentlyAbled</option>
                        <option value="educationStatus">educationStatus</option>
                        <option value="state">state</option>
                      </select>

                      <select
                        value={rule.operator}
                        onChange={(e) => handleRuleChange(idx, 'operator', e.target.value)}
                        className="py-1 px-2 text-xs bg-white border border-slate-300 rounded font-mono"
                      >
                        <option value="equals">=</option>
                        <option value="not_equals">≠</option>
                        <option value="less_than_or_equal">≤</option>
                        <option value="greater_than_or_equal">≥</option>
                        <option value="in">in</option>
                        <option value="is_true">is true</option>
                      </select>

                      <input
                        type="text"
                        value={String(rule.value)}
                        onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
                        className="py-1 px-2 text-xs bg-white border border-slate-300 rounded font-mono"
                        placeholder="Value"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRule(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={rule.description}
                    onChange={(e) => handleRuleChange(idx, 'description', e.target.value)}
                    className="w-full py-1 px-2 text-xs bg-white border border-slate-300 rounded"
                    placeholder="Plain text description for citizens"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Required Documents Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Required Document Checklists ({formData.requiredDocuments.length})
              </span>
              <button
                type="button"
                onClick={addDocReq}
                className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-900 rounded border border-blue-200 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Document
              </button>
            </div>

            <div className="space-y-2">
              {formData.requiredDocuments.map((doc, idx) => (
                <div key={doc.id || idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={doc.name}
                      onChange={(e) => handleDocReqChange(idx, 'name', e.target.value)}
                      className="py-1 px-2 text-xs bg-white border border-slate-300 rounded font-semibold flex-1"
                      placeholder="Document Name (e.g. Aadhaar Card)"
                    />
                    <button
                      type="button"
                      onClick={() => removeDocReq(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={doc.description}
                    onChange={(e) => handleDocReqChange(idx, 'description', e.target.value)}
                    className="w-full py-1 px-2 text-xs bg-white border border-slate-300 rounded"
                    placeholder="Description & purpose"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reject Scheme Draft</h3>
            <p className="text-xs text-slate-600">
              Provide specific regulatory objections or missing statutory evidence reasons for the audit trail:
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Source notification does not provide clear income ceilings or issuing authority sign-off."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (rejectionReason.trim()) {
                    onReject(scheme.id, rejectionReason.trim());
                    setRejectModalOpen(false);
                  }
                }}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
