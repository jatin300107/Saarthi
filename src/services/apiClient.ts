import {
  AuditEvent,
  AuthUser,
  CitizenProfile,
  IngestedDocument,
  Scheme,
  SchemeEvaluationResult,
  SchemeSector,
  SchemeStatus,
  SchemeVersion,
  UserRole,
} from '../types';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const TOKEN_KEY = 'saarthi_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || errorData.error || `Request failed with HTTP status ${res.status}`;
    throw new ApiError(message, res.status, errorData.code);
  }

  return res.json() as Promise<T>;
}

export const ApiClient = {
  getAuthToken,
  setAuthToken,

  async getHealth() {
    return request<{ status: string; geminiConfigured: boolean; authStrategy: string }>('/api/health');
  },

  // Authentication & Session
  async login(email: string, password: string) {
    const res = await request<{ token: string; user: AuthUser; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.token);
    return res;
  },

  async register(name: string, email: string, password: string) {
    const res = await request<{ token: string; user: AuthUser; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setAuthToken(res.token);
    return res;
  },

  async logout() {
    setAuthToken(null);
  },

  async getMe() {
    return request<{ user: AuthUser }>('/api/auth/me');
  },

  // Admin User & Role Management
  async getUsers() {
    return request<{
      users: Array<{
        id: string;
        name: string;
        email: string;
        role: UserRole;
        designation?: string;
        department?: string;
        createdAt: string;
      }>;
    }>('/api/users');
  },

  async updateUserRole(userId: string, role: UserRole) {
    return request<{ user: AuthUser; message: string }>(`/api/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  // Scheme Endpoints
  async getSchemes(filters?: {
    sector?: SchemeSector;
    status?: SchemeStatus;
    search?: string;
    state?: string;
    level?: string;
  }) {
    const query = new URLSearchParams();
    if (filters?.sector) query.set('sector', filters.sector);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.search) query.set('search', filters.search);
    if (filters?.state) query.set('state', filters.state);
    if (filters?.level) query.set('level', filters.level);

    const queryString = query.toString();
    const url = `/api/schemes${queryString ? `?${queryString}` : ''}`;
    return request<{ schemes: Scheme[]; total: number }>(url);
  },

  async getSchemeById(id: string) {
    return request<{ scheme: Scheme; versions: SchemeVersion[] }>(`/api/schemes/${id}`);
  },

  async createScheme(schemeData: Partial<Scheme>) {
    return request<{ scheme: Scheme }>('/api/schemes', {
      method: 'POST',
      body: JSON.stringify(schemeData),
    });
  },

  async updateScheme(id: string, updates: Partial<Scheme>, changeSummary?: string) {
    return request<{ scheme: Scheme }>(`/api/schemes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updates, changeSummary }),
    });
  },

  async approveScheme(id: string) {
    return request<{ scheme: Scheme; message: string }>(`/api/schemes/${id}/approve`, {
      method: 'POST',
    });
  },

  async rejectScheme(id: string, reason: string) {
    return request<{ scheme: Scheme; message: string }>(`/api/schemes/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Document Ingestion
  async uploadDocument(data: {
    filename: string;
    rawText?: string;
    pdfBase64?: string;
    fileSize?: number;
    isDemo?: boolean;
  }) {
    return request<{
      document: IngestedDocument;
      schemeDraft: Scheme;
      extractionConfidence: number;
      message: string;
    }>('/api/documents/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getDocuments() {
    return request<{ documents: IngestedDocument[] }>('/api/documents');
  },

  async getDocumentById(id: string) {
    return request<{ document: IngestedDocument }>(`/api/documents/${id}`);
  },

  // Eligibility Evaluation
  async evaluateEligibility(profile: CitizenProfile) {
    return request<{
      summary: {
        totalEvaluated: number;
        eligibleCount: number;
        insufficientCount: number;
        ineligibleCount: number;
      };
      results: {
        eligible: SchemeEvaluationResult[];
        insufficient: SchemeEvaluationResult[];
        ineligible: SchemeEvaluationResult[];
      };
    }>('/api/eligibility/evaluate', {
      method: 'POST',
      body: JSON.stringify({ profile }),
    });
  },

  async explainEligibility(
    schemeId: string,
    profile: CitizenProfile,
    evaluation: SchemeEvaluationResult,
    preferredModel?: string
  ) {
    return request<{ explanation: string; modelUsed: string }>('/api/eligibility/explain', {
      method: 'POST',
      body: JSON.stringify({ schemeId, profile, evaluation, preferredModel }),
    });
  },

  async chatWithSchemeAssistant(
    schemeId: string,
    messages: { role: 'user' | 'model'; content: string }[],
    userProfile?: CitizenProfile,
    preferredModel?: string
  ) {
    return request<{ reply: string; modelUsed: string; schemeId: string; schemeCode: string }>(
      `/api/schemes/${schemeId}/chat`,
      {
        method: 'POST',
        body: JSON.stringify({ messages, userProfile, preferredModel }),
      }
    );
  },

  // Audit Logs & Administration
  async getAuditLogs(limit = 100) {
    return request<{ logs: AuditEvent[] }>(`/api/audit?limit=${limit}`);
  },

  async resetDatabase() {
    return request<{ message: string }>('/api/admin/reset-db', {
      method: 'POST',
    });
  },

  // Backward compatibility alias for demo reset
  async resetDemoData() {
    return request<{ message: string }>('/api/admin/reset-db', {
      method: 'POST',
    });
  },
};
