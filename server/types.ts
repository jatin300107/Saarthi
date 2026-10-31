/**
 * SAARTHI Core Server & Shared Types
 */

export type SchemeSector = 'Agriculture' | 'Education' | 'Healthcare' | 'MSME' | 'Social Welfare';

export type SchemeLevel = 'Central' | 'State';

export type SchemeStatus = 'draft' | 'under_review' | 'approved' | 'rejected';

export type UserRole = 'citizen' | 'reviewer' | 'admin';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp?: string;
}

export type RuleOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'less_than_or_equal' 
  | 'greater_than_or_equal' 
  | 'in' 
  | 'not_in' 
  | 'is_true' 
  | 'is_false';

export interface EligibilityRule {
  id: string;
  field: string; // e.g. 'age', 'annualIncome', 'state', 'gender', 'socialCategory', 'occupation', 'landHoldingHectares', 'isBplCardHolder', 'isDifferentlyAbled', 'educationStatus'
  operator: RuleOperator;
  value: string | number | boolean | string[];
  description: string;
  mandatory: boolean;
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  mandatory: boolean;
  issuingAuthority?: string;
}

export interface SchemeVersion {
  version: number;
  updatedAt: string;
  updatedBy: string;
  changeSummary: string;
  snapshot: {
    title: string;
    level: SchemeLevel;
    state: string;
    sector: SchemeSector;
    status: SchemeStatus;
    rulesCount: number;
  };
}

export interface SourceEvidence {
  documentId: string;
  documentTitle: string;
  gazetteNumber?: string;
  gazetteDate?: string;
  pageReferences: number[];
  extractedParagraphSnippet: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface Scheme {
  id: string;
  code: string; // e.g. 'PM-KISAN', 'PM-JAY-01'
  title: string;
  shortDescription: string;
  detailedOverview: string;
  sector: SchemeSector;
  level: SchemeLevel;
  state: string; // 'All India' or specific State/UT
  ministry: string;
  department?: string;
  benefits: string[];
  financialAssistance?: string; // e.g. '₹6,000 per year in 3 direct bank transfers'
  rules: EligibilityRule[];
  exclusions: string[];
  requiredDocuments: DocumentRequirement[];
  applicationProcedure: string[];
  effectiveDates: {
    startDate?: string;
    endDate?: string;
    isOngoing: boolean;
  };
  officialUrl: string;
  portalHelpline?: string;
  status: SchemeStatus;
  isDemo: boolean; // Explicitly true for fictional testing schemes
  version: number;
  sourceEvidence?: SourceEvidence;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface CitizenProfile {
  state: string;
  age?: number;
  gender?: 'all' | 'female' | 'male' | 'transgender';
  socialCategory?: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  annualIncome?: number; // in INR
  occupation?: string; // 'Farmer', 'Student', 'Small Business Owner / Artisan', 'Self-Employed', 'Salaried', 'Unemployed'
  landHoldingHectares?: number; // for agriculture schemes
  isBplCardHolder?: boolean;
  isDifferentlyAbled?: boolean;
  educationStatus?: 'none' | 'school' | 'undergraduate' | 'postgraduate' | 'vocational';
  minorityCommunity?: boolean;
}

export type EligibilityMatchStatus = 'eligible' | 'ineligible' | 'insufficient_info';

export interface RuleEvaluationResult {
  ruleId: string;
  field: string;
  description: string;
  status: 'passed' | 'failed' | 'missing_data';
  expected: string;
  actual: string;
  mandatory: boolean;
}

export interface SchemeEvaluationResult {
  schemeId: string;
  schemeCode: string;
  schemeTitle: string;
  sector: SchemeSector;
  level: SchemeLevel;
  state: string;
  status: EligibilityMatchStatus;
  confidenceScore: number; // 0 - 100 percentage of verifiable rules passed
  passedRules: RuleEvaluationResult[];
  failedRules: RuleEvaluationResult[];
  missingRules: RuleEvaluationResult[];
  reasons: string[];
  documentChecklist: DocumentRequirement[];
  officialUrl: string;
  benefitsSummary: string[];
  plainExplanation?: string;
}

export interface IngestedDocument {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  pageCount: number;
  gazetteNumber?: string;
  extractedText: string;
  pageTexts: { page: number; text: string }[];
  status: 'uploaded' | 'extracted' | 'draft_generated' | 'failed';
  errorDetails?: string;
  generatedSchemeId?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  action: 
    | 'DOCUMENT_UPLOADED'
    | 'AI_EXTRACTION_COMPLETED'
    | 'EXTRACTION_FAILED'
    | 'SCHEME_DRAFT_CREATED'
    | 'SCHEME_MODIFIED'
    | 'SCHEME_APPROVED'
    | 'SCHEME_REJECTED'
    | 'SCHEME_VERSION_INCREMENTED'
    | 'ELIGIBILITY_EVALUATION_PERFORMED'
    | 'DATABASE_RESET_TO_DEMO'
    | 'USER_REGISTERED'
    | 'USER_LOGGED_IN'
    | 'USER_ROLE_UPDATED';
  targetId: string;
  targetType: 'scheme' | 'document' | 'citizen_query' | 'system' | 'user';
  summary: string;
  details?: Record<string, unknown>;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: string;
  department?: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  designation?: string;
  department?: string;
  createdAt: string;
  updatedAt?: string;
}
