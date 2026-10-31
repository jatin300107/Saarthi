import React, { useState, useEffect } from 'react';
import { AuthUser, IngestedDocument, Scheme, UserRole } from '../types';
import { ApiClient } from '../services/apiClient';
import {
  Upload,
  FileText,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  FileCheck,
  Clock,
  Layers,
  Users,
  ShieldAlert,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: AuthUser | null;
  schemes: Scheme[];
  documents: IngestedDocument[];
  onUploadDocument: (data: {
    filename: string;
    rawText?: string;
    pdfBase64?: string;
    fileSize?: number;
    isDemo?: boolean;
  }) => Promise<void>;
  onOpenReviewStudio: (scheme: Scheme) => void;
  onResetDatabase: () => Promise<void>;
  loading: boolean;
  onNavigateToAudit: () => void;
}

const SAMPLE_CIRCULAR_KUSUM = `GOVERNMENT OF INDIA
MINISTRY OF NEW AND RENEWABLE ENERGY
NOTIFICATION
New Delhi, the 15th January, 2026

No. 283/54/2026-GRID - Operational Guidelines for PM-KUSUM Solar Agripump Scheme 2.0

1. Scheme Name: Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM-KUSUM 2.0)
2. Objective: To provide clean energy security to farmers by subsidizing individual stand-alone solar agriculture pumps up to 7.5 HP in off-grid rural areas.
3. Level: Central Sector Scheme applicable across All India with state agriculture nodal agencies.
4. Target Beneficiaries & Eligibility Rules:
   - Applicant must be an operational farmer with valid cultivable landholding.
   - Landholding must be equal to or greater than 0.5 hectares and less than or equal to 5.0 hectares.
   - Annual family income must not exceed ₹6,00,000 per annum.
   - Applicant must not already have a grid-connected electricity connection for the tube well.
5. Tangible Financial Benefits:
   - Central Government Financial Assistance (CFA) of 30% of benchmark cost.
   - State Government subsidy of 30%.
   - Farmer contribution only 40% (with loan facility up to 30% from nationalized banks).
6. Required Documents:
   - Aadhaar Card of farmer
   - Land Ownership Certificate (Khasra / Khatoni)
   - Bank Passbook linked with Aadhaar
   - Declaration of no existing agricultural electric connection
7. Application Procedure:
   - Apply online via State Nodal Agency KUSUM portal.
   - Field verification of water table and land by District Renewable Energy Officer.
   - Issuance of sanction letter and installation within 90 days.
8. Official Portal: https://pmkusum.mnre.gov.in
   Helpline: 1800-180-3333`;

const SAMPLE_CIRCULAR_STEM = `STATE GOVERNMENT OF KARNATAKA
DEPARTMENT OF HIGHER EDUCATION & SKILL DEVELOPMENT
GOVERNMENT ORDER
Bengaluru, dated 10th February, 2026

G.O. No. ED/42/HED/2026 - Kalpana Chawla STEM Excellence Scholarship for Young Women

1. Scheme Name: Kalpana Chawla Digital STEM Scholarship Scheme
2. Sector: Education & Skilling
3. Level: State Scheme (Karnataka)
4. Objective: To empower young women from economically vulnerable households pursuing higher technical education in Engineering, AI, and Biotechnology.
5. Statutory Eligibility Rules:
   - Applicant must be a bona fide resident domiciled in Karnataka.
   - Gender: Exclusively for Female candidates.
   - Applicant must be enrolled in an Undergraduate or Postgraduate degree in a recognized university.
   - Annual family income must not exceed ₹4,00,000 per annum.
   - Minimum 60% marks in Class 12th Board examinations.
6. Entitlements & Benefits:
   - Direct scholarship grant of ₹50,000 per academic year for tuition and books.
   - 100% reimbursement of exam and university registration fees.
   - Free access to state technical innovation hackathons.
7. Required Documents:
   - Karnataka Domicile Certificate issued by Tahsildar
   - College Bonafide Certificate with course registration
   - Income Certificate (under ₹4,00,000)
   - Aadhaar Card and Student Bank Passbook
8. Official Portal: https://ssp.karnataka.gov.in`;

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  schemes,
  documents,
  onUploadDocument,
  onOpenReviewStudio,
  onResetDatabase,
  loading,
  onNavigateToAudit,
}) => {
  const [activeTab, setActiveTab] = useState<'ingestion' | 'queue' | 'catalog' | 'users'>('ingestion');
  const [filename, setFilename] = useState('');
  const [rawText, setRawText] = useState('');
  const [isDemoScheme, setIsDemoScheme] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  // User Management state (for admins)
  const [usersList, setUsersList] = useState<Array<{ id: string; name: string; email: string; role: UserRole; designation?: string; department?: string; createdAt: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const loadUsers = async () => {
    if (!isAdmin) return;
    setUsersLoading(true);
    try {
      const res = await ApiClient.getUsers();
      setUsersList(res.users);
    } catch (err: any) {
      setUserActionMsg(`Failed loading users: ${err.message}`);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      loadUsers();
    }
  }, [activeTab, isAdmin]);

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      setUserActionMsg(null);
      await ApiClient.updateUserRole(userId, newRole);
      setUserActionMsg(`Updated user role to ${newRole}.`);
      await loadUsers();
    } catch (err: any) {
      setUserActionMsg(`Error updating role: ${err.message}`);
    }
  };

  const pendingDrafts = schemes.filter((s) => s.status === 'under_review' || s.status === 'draft');
  const approvedSchemes = schemes.filter((s) => s.status === 'approved');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    setUploadError(null);

    // Check file size (cap at 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10MB maximum size limit.');
      return;
    }

    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setRawText(`[Binary PDF file loaded: ${file.name}]`);
        (window as any).__pendingPdfBase64 = base64Data;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setRawText(reader.result as string);
        (window as any).__pendingPdfBase64 = undefined;
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSample = (sampleType: 'kusum' | 'stem') => {
    setUploadError(null);
    if (sampleType === 'kusum') {
      setFilename('PM-KUSUM-Solar-Agripump-Circular-2026.txt');
      setRawText(SAMPLE_CIRCULAR_KUSUM);
      setIsDemoScheme(false);
    } else {
      setFilename('Karnataka-Kalpana-STEM-Notification-2026.txt');
      setRawText(SAMPLE_CIRCULAR_STEM);
      setIsDemoScheme(false);
    }
  };

  const handleTriggerIngestion = async () => {
    if (!filename || !rawText.trim()) {
      setUploadError('Please select a file or paste document text before triggering ingestion.');
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);

    try {
      const pdfBase64 = (window as any).__pendingPdfBase64;
      await onUploadDocument({
        filename,
        rawText,
        pdfBase64,
        isDemo: isDemoScheme,
      });

      setUploadSuccess(`Successfully ingested "${filename}"! AI extracted structured draft awaiting verification.`);
      setFilename('');
      setRawText('');
      (window as any).__pendingPdfBase64 = undefined;
      setActiveTab('queue');
    } catch (err: any) {
      setUploadError(`Document Ingestion / OCR Extraction Failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Admin KPI Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Administrative & Regulatory Verification Center</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Scheme Ingestion & Human-in-the-Loop Governance
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ingest gazette circulars, audit AI-extracted rules, and publish verified schemes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToAudit}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-slate-400" />
              View Audit Trail
            </button>

            {isAdmin ? (
              <button
                onClick={() => {
                  if (resetConfirm) {
                    onResetDatabase();
                    setResetConfirm(false);
                  } else {
                    setResetConfirm(true);
                    setTimeout(() => setResetConfirm(false), 5000);
                  }
                }}
                className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Reset database to official baseline (Admin Only)"
              >
                <RefreshCw className="w-4 h-4" />
                {resetConfirm ? 'Click to Confirm Reset' : 'Reset Database (Admin)'}
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-700/60 font-mono">
                Reset: Admin Only
              </span>
            )}
          </div>
        </div>

        {/* 4-KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block">Active Published Schemes</span>
            <span className="font-mono text-xl font-bold text-emerald-400 tabular-nums">
              {approvedSchemes.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Pending Review Drafts</span>
            <span className="font-mono text-xl font-bold text-amber-400 tabular-nums">
              {pendingDrafts.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Ingested Documents</span>
            <span className="font-mono text-xl font-bold text-blue-300 tabular-nums">
              {documents.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Verification Protocol</span>
            <span className="font-mono text-xl font-bold text-white tabular-nums">
              Human Sign-Off
            </span>
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ingestion')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ingestion'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          1. Document Ingestion & AI OCR
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'queue'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          2. Verification Queue ({pendingDrafts.length})
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'catalog'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          3. Published Catalog ({approvedSchemes.length})
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            4. User & Role Governance
          </button>
        )}
      </div>

      {/* Tab 1: Document Ingestion */}
      {activeTab === 'ingestion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Upload Official Gazette Circular or PDF
              </h2>
              <p className="text-xs text-slate-500">
                The platform will extract raw text/OCR, preserve page references, and use Gemini 2.5 Flash to generate a structured scheme draft.
              </p>
            </div>

            {uploadError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Extraction Error:</span>
                  <span>{uploadError}</span>
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Extraction Complete:</span>
                  <span>{uploadSuccess}</span>
                </div>
              </div>
            )}

            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-900 transition-colors bg-slate-50/50">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">
                Drag and drop a PDF file or circular document here
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Supports PDF, TXT, or scanned gazette circulars (Max 10MB)
              </p>
              <label className="inline-flex items-center px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 shadow-xs cursor-pointer">
                <span>Select File from Device</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {filename && (
                <div className="mt-3 text-xs font-mono font-semibold text-blue-900 bg-blue-50 py-1.5 px-3 rounded inline-block border border-blue-200">
                  Selected File: {filename}
                </div>
              )}
            </div>

            {/* Document Text Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Document Text Content / OCR Transcription
                </label>
                <span className="text-[11px] text-slate-500">
                  Page dividers like <code className="font-mono text-slate-700">--- Page 2 ---</code> are preserved
                </span>
              </div>
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste verbatim notification text or inspect extracted PDF content..."
                className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-900 leading-relaxed"
              />
            </div>

            {/* Demo Flag Checkbox */}
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isDemoScheme}
                onChange={(e) => setIsDemoScheme(e.target.checked)}
                className="w-4 h-4 text-blue-900 rounded border-slate-300"
              />
              <span>
                Mark as <strong>Synthetic Demo Record</strong> (will be clearly labeled as non-government test record)
              </span>
            </label>

            {/* Submit Action Button */}
            <button
              onClick={handleTriggerIngestion}
              disabled={loading || !rawText.trim()}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running Gemini 2.5 Flash Multimodal Schema Extraction...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Extract Structured Scheme Fields with Gemini AI
                </>
              )}
            </button>
          </div>

          {/* Right Column: 1-Click Test Samples & Ingestion Log (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                Instant Test Circulars
              </span>
              <p className="text-xs text-slate-600">
                Test the end-to-end ingestion pipeline with authentic Indian gazette circular formats:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleLoadSample('kusum')}
                  className="w-full text-left p-3 rounded-lg bg-white hover:bg-amber-100/50 border border-amber-200 transition-colors text-xs space-y-1 cursor-pointer"
                >
                  <span className="font-bold text-slate-900 block">
                    PM-KUSUM 2.0 Solar Agripump Scheme
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Agriculture · Central Sector · Land & Income Rules
                  </span>
                </button>

                <button
                  onClick={() => handleLoadSample('stem')}
                  className="w-full text-left p-3 rounded-lg bg-white hover:bg-amber-100/50 border border-amber-200 transition-colors text-xs space-y-1 cursor-pointer"
                >
                  <span className="font-bold text-slate-900 block">
                    Kalpana Chawla STEM Scholarship
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Education · State (Karnataka) · Female College Students
                  </span>
                </button>
              </div>
            </div>

            {/* Ingestion Document History */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Recently Ingested Documents
              </span>
              <div className="space-y-2">
                {documents.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-semibold text-slate-900 block line-clamp-1">{doc.filename}</span>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{doc.pageCount} Pages</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Verification Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Draft Schemes Awaiting Human Verification ({pendingDrafts.length})
            </h2>
            <span className="text-xs text-slate-500">
              Reviewers must audit rules and citations before public listing
            </span>
          </div>

          {pendingDrafts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">Verification Queue is Clear</p>
              <p className="text-xs text-slate-500 mt-1">
                All uploaded documents have been inspected and published.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-white rounded-xl border border-amber-200 p-5 space-y-3 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        {draft.code}
                      </span>
                      <span className="text-xs font-semibold text-amber-700 uppercase">
                        {draft.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{draft.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{draft.shortDescription}</p>

                    <div className="text-[11px] text-slate-500">
                      <span>Sector: {draft.sector} · Level: {draft.level} · State: {draft.state}</span>
                    </div>

                    {draft.sourceEvidence && (
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
                        <span className="font-semibold block text-slate-800">Linked Source Document:</span>
                        <span className="text-slate-600 line-clamp-1">{draft.sourceEvidence.documentTitle}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => onOpenReviewStudio(draft)}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Open Side-by-Side Review Studio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Published Scheme Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Published Scheme Catalog ({approvedSchemes.length})
            </h2>
            <span className="text-xs text-slate-500">
              Active schemes publicly searchable by citizens
            </span>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            {approvedSchemes.map((scheme) => (
              <div key={scheme.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{scheme.code}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-800">{scheme.title}</span>
                    {scheme.isDemo && (
                      <span className="bg-amber-100 text-amber-800 font-mono text-[10px] px-1.5 py-0.5 rounded">
                        DEMO
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 block">
                    {scheme.sector} · {scheme.level} ({scheme.state}) · Version {scheme.version}.0 · Approved by: {scheme.approvedBy || 'Registrar'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenReviewStudio(scheme)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-300 cursor-pointer"
                  >
                    Edit / New Version
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: User & Role Governance (Admin Only) */}
      {activeTab === 'users' && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-700" />
                System User Directory & Role Governance
              </h2>
              <p className="text-xs text-slate-500">
                Department Administrators can grant or revoke Regulatory Reviewer and Admin capabilities.
              </p>
            </div>
            <button
              onClick={loadUsers}
              disabled={usersLoading}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
              Refresh Users
            </button>
          </div>

          {userActionMsg && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 font-medium">
              {userActionMsg}
            </div>
          )}

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role Badge</th>
                  <th className="py-3 px-4">Designation & Department</th>
                  <th className="py-3 px-4 text-right">Assign Server Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      {u.role === 'admin' && (
                        <span className="font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded text-[11px] border border-purple-200">
                          admin
                        </span>
                      )}
                      {u.role === 'reviewer' && (
                        <span className="font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                          reviewer
                        </span>
                      )}
                      {u.role === 'citizen' && (
                        <span className="font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                          citizen
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{u.designation || 'Citizen'}</div>
                      <div className="text-[10px] text-slate-400">{u.department || 'Public Portal'}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                        className="text-xs font-semibold bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-700 cursor-pointer"
                      >
                        <option value="citizen">Citizen</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
