import React, { useState, useEffect } from 'react';
import {
  AuditEvent,
  AuthUser,
  CitizenProfile,
  IngestedDocument,
  Scheme,
  SchemeEvaluationResult,
  SchemeSector,
  SchemeVersion,
  UserRole,
} from './types';
import { ApiClient } from './services/apiClient';
import { Header } from './components/Header';
import { RoleBanner } from './components/RoleBanner';
import { CitizenPortal } from './components/CitizenPortal';
import { ProfileWizardModal } from './components/ProfileWizardModal';
import { EligibilityResultsView } from './components/EligibilityResultsView';
import { SchemeDetailModal } from './components/SchemeDetailModal';
import { AdminDashboard } from './components/AdminDashboard';
import { DocumentReviewStudio } from './components/DocumentReviewStudio';
import { AuditLogView } from './components/AuditLogView';
import { SchemeChatModal } from './components/SchemeChatModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [activeView, setActiveView] = useState<'citizen' | 'wizard' | 'results' | 'admin' | 'review' | 'audit'>('citizen');
  
  // Data states
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [documents, setDocuments] = useState<IngestedDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  
  // Selection states
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [selectedSchemeVersions, setSelectedSchemeVersions] = useState<SchemeVersion[]>([]);
  const [reviewingScheme, setReviewingScheme] = useState<Scheme | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [chattingScheme, setChattingScheme] = useState<Scheme | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  // Filters
  const [selectedSector, setSelectedSector] = useState<SchemeSector | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All India');

  // Evaluation state
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile>({
    state: 'Uttar Pradesh',
    age: 28,
    gender: 'all',
    socialCategory: 'OBC',
    annualIncome: 180000,
    occupation: 'Farmer',
    landHoldingHectares: 1.5,
    isBplCardHolder: false,
    isDifferentlyAbled: false,
    educationStatus: 'school',
  });
  const [evaluationResults, setEvaluationResults] = useState<{
    eligible: SchemeEvaluationResult[];
    insufficient: SchemeEvaluationResult[];
    ineligible: SchemeEvaluationResult[];
  } | null>(null);

  // Loading & toast states
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const currentRole: UserRole = currentUser?.role || 'citizen';
  const isOfficerOrAdmin = currentRole === 'reviewer' || currentRole === 'admin';

  // Check existing session on boot
  useEffect(() => {
    const initializeAuth = async () => {
      const token = ApiClient.getAuthToken();
      if (!token) return;
      try {
        const res = await ApiClient.getMe();
        setCurrentUser(res.user);
      } catch (err) {
        ApiClient.setAuthToken(null);
        setCurrentUser(null);
      }
    };
    initializeAuth();
  }, []);

  // Load schemes based on active role
  const loadSchemes = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.getSchemes({
        sector: selectedSector !== 'All' ? selectedSector : undefined,
        search: searchQuery || undefined,
        state: selectedState !== 'All India' ? selectedState : undefined,
      });
      setSchemes(res.schemes);
    } catch (err: any) {
      showToast(`Failed loading schemes: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load documents for admin/reviewer
  const loadDocuments = async () => {
    if (!isOfficerOrAdmin) return;
    try {
      const res = await ApiClient.getDocuments();
      setDocuments(res.documents);
    } catch (err: any) {
      console.warn('Documents query note:', err.message);
    }
  };

  // Load audit logs
  const loadAuditLogs = async () => {
    if (!isOfficerOrAdmin) return;
    try {
      const res = await ApiClient.getAuditLogs(100);
      setAuditLogs(res.logs);
    } catch (err: any) {
      console.warn('Audit logs note:', err.message);
    }
  };

  useEffect(() => {
    loadSchemes();
    if (isOfficerOrAdmin) {
      loadDocuments();
      loadAuditLogs();
    } else {
      setDocuments([]);
      setAuditLogs([]);
    }
  }, [selectedSector, searchQuery, selectedState, currentUser]);

  const handleLogout = async () => {
    await ApiClient.logout();
    setCurrentUser(null);
    if (activeView === 'admin' || activeView === 'review' || activeView === 'audit') {
      setActiveView('citizen');
    }
    showToast('Signed out of session.', 'info');
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    showToast(`Signed in as ${user.name} (${user.role.toUpperCase()})`, 'success');
  };

  const handleSelectScheme = async (scheme: Scheme) => {
    try {
      setLoading(true);
      const res = await ApiClient.getSchemeById(scheme.id);
      setSelectedScheme(res.scheme);
      setSelectedSchemeVersions(res.versions);
      setDetailModalOpen(true);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSchemeById = async (schemeId: string) => {
    const s = schemes.find((item) => item.id === schemeId);
    if (s) {
      await handleSelectScheme(s);
    }
  };

  const handleOpenWizard = () => {
    setWizardOpen(true);
  };

  const handleOpenChat = (scheme: Scheme) => {
    setChattingScheme(scheme);
    setChatModalOpen(true);
  };

  const handleEvaluateProfile = async (profile: CitizenProfile) => {
    setCitizenProfile(profile);
    setWizardOpen(false);
    setLoading(true);
    try {
      const res = await ApiClient.evaluateEligibility(profile);
      setEvaluationResults(res.results);
      setActiveView('results');
      showToast(
        `Eligibility evaluation complete! ${res.results.eligible.length} schemes matching your profile.`,
        'success'
      );
    } catch (err: any) {
      showToast(`Evaluation error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewStudio = (scheme: Scheme) => {
    setReviewingScheme(scheme);
    setActiveView('review');
  };

  const handleApproveScheme = async (schemeId: string) => {
    setLoading(true);
    try {
      const res = await ApiClient.approveScheme(schemeId);
      showToast(res.message, 'success');
      await loadSchemes();
      await loadAuditLogs();
      setActiveView('admin');
    } catch (err: any) {
      showToast(`Approval failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectScheme = async (schemeId: string, reason: string) => {
    setLoading(true);
    try {
      const res = await ApiClient.rejectScheme(schemeId, reason);
      showToast(res.message, 'info');
      await loadSchemes();
      await loadAuditLogs();
      setActiveView('admin');
    } catch (err: any) {
      showToast(`Rejection failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchemeUpdates = async (
    schemeId: string,
    updates: Partial<Scheme>,
    changeSummary = 'Reviewer updated scheme parameters'
  ) => {
    setLoading(true);
    try {
      const res = await ApiClient.updateScheme(schemeId, updates, changeSummary);
      showToast(`Version ${res.scheme.version} recorded successfully!`, 'success');
      await loadSchemes();
      await loadAuditLogs();
      setReviewingScheme(res.scheme);
    } catch (err: any) {
      showToast(`Save updates failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (data: {
    filename: string;
    rawText?: string;
    pdfBase64?: string;
    fileSize?: number;
    isDemo?: boolean;
  }) => {
    setLoading(true);
    try {
      const res = await ApiClient.uploadDocument(data);
      showToast(res.message, 'success');
      await loadSchemes();
      await loadDocuments();
      await loadAuditLogs();
    } finally {
      setLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.resetDatabase();
      showToast(res.message, 'info');
      await loadSchemes();
      await loadDocuments();
      await loadAuditLogs();
    } catch (err: any) {
      showToast(`Reset failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 max-w-md ${
              toast.type === 'error'
                ? 'bg-red-900 text-white border-red-800'
                : toast.type === 'info'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-emerald-800 text-white border-emerald-700'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'wizard') {
            setWizardOpen(true);
          } else {
            setActiveView(view);
          }
        }}
      />

      {/* Role State Sub-banner */}
      <RoleBanner currentUser={currentUser} onOpenAuthModal={() => setAuthModalOpen(true)} />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeView === 'citizen' && (
          <CitizenPortal
            schemes={schemes}
            loading={loading}
            onSelectScheme={handleSelectScheme}
            onOpenWizard={handleOpenWizard}
            selectedSector={selectedSector}
            onSectorChange={setSelectedSector}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedState={selectedState}
            onStateChange={setSelectedState}
            onOpenChat={handleOpenChat}
          />
        )}

        {activeView === 'results' && evaluationResults && (
          <EligibilityResultsView
            profile={citizenProfile}
            results={evaluationResults}
            onEditProfile={() => setWizardOpen(true)}
            onSelectSchemeById={handleSelectSchemeById}
            onBackToDirectory={() => setActiveView('citizen')}
            onOpenChat={(schemeId) => {
              const s = schemes.find((sc) => sc.id === schemeId);
              if (s) handleOpenChat(s);
            }}
          />
        )}

        {/* Verification Studio (Reviewer & Admin Only Guard) */}
        {activeView === 'admin' && (
          isOfficerOrAdmin ? (
            <AdminDashboard
              currentUser={currentUser}
              schemes={schemes}
              documents={documents}
              onUploadDocument={handleUploadDocument}
              onOpenReviewStudio={handleOpenReviewStudio}
              onResetDatabase={handleResetDatabase}
              loading={loading}
              onNavigateToAudit={() => setActiveView('audit')}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-xl mx-auto text-center space-y-4 shadow-sm my-12">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700 border border-amber-200">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Verification Studio Restricted</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingesting official circulars, editing scheme parameters, and issuing approvals are strictly restricted to verified <strong>Regulatory Reviewers</strong> and <strong>Department Administrators</strong> under server-side RBAC.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In with Officer Credentials
                </button>
              </div>
            </div>
          )
        )}

        {/* Side-by-side Review Studio (Reviewer & Admin Only Guard) */}
        {activeView === 'review' && reviewingScheme && (
          isOfficerOrAdmin ? (
            <DocumentReviewStudio
              scheme={reviewingScheme}
              document={documents.find((d) => d.id === reviewingScheme.sourceEvidence?.documentId)}
              onApprove={handleApproveScheme}
              onReject={handleRejectScheme}
              onSaveUpdates={handleSaveSchemeUpdates}
              onBack={() => setActiveView('admin')}
              loading={loading}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-xl mx-auto text-center space-y-4 shadow-sm my-12">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-700 border border-red-200">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
              <p className="text-xs text-slate-600">
                Reviewing scheme drafts requires verified reviewer authorization.
              </p>
            </div>
          )
        )}

        {/* Audit Trail View (Reviewer & Admin Only Guard) */}
        {activeView === 'audit' && (
          isOfficerOrAdmin ? (
            <AuditLogView
              logs={auditLogs}
              onRefresh={loadAuditLogs}
              loading={loading}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-xl mx-auto text-center space-y-4 shadow-sm my-12">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700 border border-amber-200">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Audit Trail Restricted</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Immutable audit logs and version history are restricted to authorized verification officers and administrative personnel.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In with Officer Credentials
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Profile Wizard Modal */}
      <ProfileWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleEvaluateProfile}
        loading={loading}
        initialProfile={citizenProfile}
      />

      {/* Detailed Scheme Specification & Citations Modal */}
      <SchemeDetailModal
        scheme={selectedScheme}
        versions={selectedSchemeVersions}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onOpenWizardForScheme={(scheme) => {
          setWizardOpen(true);
        }}
        onOpenChat={(scheme) => {
          handleOpenChat(scheme);
        }}
      />

      {/* Dedicated Scheme-Specific Assistant Chat Modal */}
      <SchemeChatModal
        scheme={chattingScheme}
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        citizenProfile={citizenProfile}
      />

      {/* Civic Footer */}
      <Footer />
    </div>
  );
}
