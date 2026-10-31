import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  AuditEvent,
  AuthUser,
  IngestedDocument,
  Scheme,
  SchemeSector,
  SchemeStatus,
  SchemeVersion,
  UserRecord,
  UserRole,
} from './types';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const SCHEMES_FILE = path.join(DATA_DIR, 'schemes.json');
const DOCUMENTS_FILE = path.join(DATA_DIR, 'documents.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_log.json');
const VERSIONS_FILE = path.join(DATA_DIR, 'versions.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class Storage {
  private static schemes: Scheme[] = [];
  private static documents: IngestedDocument[] = [];
  private static auditLogs: AuditEvent[] = [];
  private static versions: Record<string, SchemeVersion[]> = {};
  private static users: UserRecord[] = [];
  private static initialized = false;

  public static initialize(): void {
    if (this.initialized) return;

    // Load or seed users
    if (fs.existsSync(USERS_FILE)) {
      try {
        const content = fs.readFileSync(USERS_FILE, 'utf-8');
        this.users = JSON.parse(content);
        if (!Array.isArray(this.users) || this.users.length === 0) {
          this.seedUsers();
        }
      } catch (e) {
        console.error('Failed reading users.json, re-seeding users:', e);
        this.seedUsers();
      }
    } else {
      this.seedUsers();
    }

    // Load or seed schemes
    if (fs.existsSync(SCHEMES_FILE)) {
      try {
        const content = fs.readFileSync(SCHEMES_FILE, 'utf-8');
        this.schemes = JSON.parse(content);
      } catch (e) {
        console.error('Failed reading schemes.json, re-seeding:', e);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }

    // Load documents
    if (fs.existsSync(DOCUMENTS_FILE)) {
      try {
        const content = fs.readFileSync(DOCUMENTS_FILE, 'utf-8');
        this.documents = JSON.parse(content);
      } catch (e) {
        this.documents = [];
      }
    }

    // Load audit logs
    if (fs.existsSync(AUDIT_FILE)) {
      try {
        const content = fs.readFileSync(AUDIT_FILE, 'utf-8');
        this.auditLogs = JSON.parse(content);
      } catch (e) {
        this.auditLogs = [];
      }
    }

    // Load versions
    if (fs.existsSync(VERSIONS_FILE)) {
      try {
        const content = fs.readFileSync(VERSIONS_FILE, 'utf-8');
        this.versions = JSON.parse(content);
      } catch (e) {
        this.versions = {};
      }
    }

    this.initialized = true;
  }

  public static seedUsers(): void {
    const saltRounds = 10;
    this.users = [
      {
        id: 'usr_admin_01',
        name: 'Sh. Rajesh Verma',
        email: 'admin@saarthi.gov.in',
        passwordHash: bcrypt.hashSync('AdminPassword@123', saltRounds),
        role: 'admin',
        designation: 'Joint Secretary (Scheme Governance)',
        department: 'Department of Public Services',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'usr_reviewer_01',
        name: 'Dr. Sunita Kulkarni',
        email: 'reviewer@saarthi.gov.in',
        passwordHash: bcrypt.hashSync('ReviewerPassword@123', saltRounds),
        role: 'reviewer',
        designation: 'Senior Regulatory Verification Officer',
        department: 'Directorate of Citizen Welfare',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'usr_citizen_01',
        name: 'Ramesh Kumar',
        email: 'citizen@saarthi.gov.in',
        passwordHash: bcrypt.hashSync('CitizenPassword@123', saltRounds),
        role: 'citizen',
        designation: 'Citizen Beneficiary',
        department: 'General Public',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing users.json:', err);
    }
  }

  private static persist(): void {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
      fs.writeFileSync(SCHEMES_FILE, JSON.stringify(this.schemes, null, 2), 'utf-8');
      fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(this.documents, null, 2), 'utf-8');
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(this.auditLogs, null, 2), 'utf-8');
      fs.writeFileSync(VERSIONS_FILE, JSON.stringify(this.versions, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting data files:', err);
    }
  }

  public static getUsers(): UserRecord[] {
    this.initialize();
    return [...this.users];
  }

  public static getUserById(id: string): UserRecord | undefined {
    this.initialize();
    return this.users.find((u) => u.id === id);
  }

  public static getUserByEmail(email: string): UserRecord | undefined {
    this.initialize();
    const normalized = email.trim().toLowerCase();
    return this.users.find((u) => u.email.trim().toLowerCase() === normalized);
  }

  public static createUser(userData: {
    name: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
    designation?: string;
    department?: string;
  }): UserRecord {
    this.initialize();
    const id = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newUser: UserRecord = {
      id,
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      passwordHash: userData.passwordHash,
      role: userData.role || 'citizen',
      designation: userData.designation || 'Citizen Beneficiary',
      department: userData.department || 'General Public',
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.persist();
    return newUser;
  }

  public static updateUserRole(userId: string, newRole: UserRole, actor: AuthUser): UserRecord {
    this.initialize();
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const previousRole = user.role;
    user.role = newRole;
    user.updatedAt = new Date().toISOString();

    this.addAuditLog({
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'USER_ROLE_UPDATED',
      targetId: user.id,
      targetType: 'user',
      summary: `Updated role for ${user.name} (${user.email}) from ${previousRole} to ${newRole}.`,
      details: { previousRole, newRole },
    });

    this.persist();
    return user;
  }

  public static getSchemes(filters?: {
    sector?: SchemeSector;
    status?: SchemeStatus;
    search?: string;
    state?: string;
    level?: string;
  }): Scheme[] {
    this.initialize();
    let result = [...this.schemes];

    if (filters) {
      if (filters.sector) {
        result = result.filter((s) => s.sector === filters.sector);
      }
      if (filters.status) {
        result = result.filter((s) => s.status === filters.status);
      }
      if (filters.state && filters.state !== 'All India') {
        result = result.filter((s) => s.state === 'All India' || s.state.toLowerCase() === filters.state!.toLowerCase());
      }
      if (filters.level) {
        result = result.filter((s) => s.level.toLowerCase() === filters.level!.toLowerCase());
      }
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        result = result.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.shortDescription.toLowerCase().includes(q) ||
            s.ministry.toLowerCase().includes(q)
        );
      }
    }

    return result;
  }

  public static getSchemeById(id: string): Scheme | undefined {
    this.initialize();
    return this.schemes.find((s) => s.id === id);
  }

  public static createScheme(schemeData: Omit<Scheme, 'id' | 'createdAt' | 'updatedAt' | 'version'>, actor: AuthUser): Scheme {
    this.initialize();
    const id = `SCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newScheme: Scheme = {
      ...schemeData,
      id,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.schemes.unshift(newScheme);

    // Initial version entry
    this.versions[id] = [
      {
        version: 1,
        updatedAt: newScheme.createdAt,
        updatedBy: `${actor.name} (${actor.role})`,
        changeSummary: 'Initial scheme draft created from document ingestion.',
        snapshot: {
          title: newScheme.title,
          level: newScheme.level,
          state: newScheme.state,
          sector: newScheme.sector,
          status: newScheme.status,
          rulesCount: newScheme.rules.length,
        },
      },
    ];

    this.addAuditLog({
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'SCHEME_DRAFT_CREATED',
      targetId: id,
      targetType: 'scheme',
      summary: `Created new scheme draft: ${newScheme.title} (${newScheme.code})`,
      details: { sector: newScheme.sector, isDemo: newScheme.isDemo },
    });

    this.persist();
    return newScheme;
  }

  public static updateScheme(
    id: string,
    updates: Partial<Omit<Scheme, 'id' | 'createdAt' | 'version'>>,
    actor: AuthUser,
    changeSummary = 'Updated scheme parameters'
  ): Scheme {
    this.initialize();
    const index = this.schemes.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Scheme with ID ${id} not found.`);
    }

    const current = this.schemes[index];
    const newVersionNum = current.version + 1;

    const updated: Scheme = {
      ...current,
      ...updates,
      version: newVersionNum,
      updatedAt: new Date().toISOString(),
    };

    this.schemes[index] = updated;

    if (!this.versions[id]) {
      this.versions[id] = [];
    }

    this.versions[id].push({
      version: newVersionNum,
      updatedAt: updated.updatedAt,
      updatedBy: `${actor.name} (${actor.role})`,
      changeSummary,
      snapshot: {
        title: updated.title,
        level: updated.level,
        state: updated.state,
        sector: updated.sector,
        status: updated.status,
        rulesCount: updated.rules.length,
      },
    });

    this.addAuditLog({
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'SCHEME_MODIFIED',
      targetId: id,
      targetType: 'scheme',
      summary: `Updated scheme "${updated.title}" to v${newVersionNum}: ${changeSummary}`,
      details: { newVersion: newVersionNum, changes: Object.keys(updates) },
    });

    this.persist();
    return updated;
  }

  public static approveScheme(id: string, actor: AuthUser): Scheme {
    this.initialize();
    const index = this.schemes.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Scheme with ID ${id} not found.`);
    }

    const current = this.schemes[index];
    const newVersionNum = current.version + 1;

    const approved: Scheme = {
      ...current,
      status: 'approved',
      approvedBy: `${actor.name} (${actor.designation || actor.role})`,
      approvedAt: new Date().toISOString(),
      rejectionReason: undefined,
      version: newVersionNum,
      updatedAt: new Date().toISOString(),
    };

    this.schemes[index] = approved;

    if (!this.versions[id]) this.versions[id] = [];
    this.versions[id].push({
      version: newVersionNum,
      updatedAt: approved.updatedAt,
      updatedBy: `${actor.name} (${actor.role})`,
      changeSummary: 'Verified and approved for public citizen discovery.',
      snapshot: {
        title: approved.title,
        level: approved.level,
        state: approved.state,
        sector: approved.sector,
        status: 'approved',
        rulesCount: approved.rules.length,
      },
    });

    this.addAuditLog({
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'SCHEME_APPROVED',
      targetId: id,
      targetType: 'scheme',
      summary: `Approved scheme "${approved.title}" for citizen publication`,
      details: { version: newVersionNum, approvedBy: approved.approvedBy },
    });

    this.persist();
    return approved;
  }

  public static rejectScheme(id: string, reason: string, actor: AuthUser): Scheme {
    this.initialize();
    const index = this.schemes.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Scheme with ID ${id} not found.`);
    }

    const current = this.schemes[index];
    const newVersionNum = current.version + 1;

    const rejected: Scheme = {
      ...current,
      status: 'rejected',
      rejectionReason: reason,
      version: newVersionNum,
      updatedAt: new Date().toISOString(),
    };

    this.schemes[index] = rejected;

    if (!this.versions[id]) this.versions[id] = [];
    this.versions[id].push({
      version: newVersionNum,
      updatedAt: rejected.updatedAt,
      updatedBy: `${actor.name} (${actor.role})`,
      changeSummary: `Rejected: ${reason}`,
      snapshot: {
        title: rejected.title,
        level: rejected.level,
        state: rejected.state,
        sector: rejected.sector,
        status: 'rejected',
        rulesCount: rejected.rules.length,
      },
    });

    this.addAuditLog({
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'SCHEME_REJECTED',
      targetId: id,
      targetType: 'scheme',
      summary: `Rejected scheme draft "${rejected.title}": ${reason}`,
      details: { reason },
    });

    this.persist();
    return rejected;
  }

  public static addDocument(doc: IngestedDocument, actor: AuthUser): IngestedDocument {
    this.initialize();
    this.documents.unshift(doc);

    this.addAuditLog({
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'DOCUMENT_UPLOADED',
      targetId: doc.id,
      targetType: 'document',
      summary: `Ingested document: ${doc.filename} (${(doc.fileSize / 1024).toFixed(1)} KB)`,
      details: { pages: doc.pageCount, status: doc.status },
    });

    this.persist();
    return doc;
  }

  public static getDocuments(): IngestedDocument[] {
    this.initialize();
    return [...this.documents];
  }

  public static getDocumentById(id: string): IngestedDocument | undefined {
    this.initialize();
    return this.documents.find((d) => d.id === id);
  }

  public static updateDocument(id: string, updates: Partial<IngestedDocument>): IngestedDocument | undefined {
    this.initialize();
    const doc = this.documents.find((d) => d.id === id);
    if (doc) {
      Object.assign(doc, updates);
      this.persist();
    }
    return doc;
  }

  public static getAuditLogs(limit = 100): AuditEvent[] {
    this.initialize();
    return this.auditLogs.slice(0, limit);
  }

  public static addAuditLog(event: AuditEvent): void {
    this.initialize();
    this.auditLogs.unshift(event);
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
    this.persist();
  }

  public static getVersions(schemeId: string): SchemeVersion[] {
    this.initialize();
    return this.versions[schemeId] || [];
  }

  public static seedInitialData(): void {
    if (this.users.length === 0) {
      this.seedUsers();
    }
    const defaultActor: AuthUser = {
      id: 'system_admin',
      name: 'System Gazette Registrar',
      email: 'registrar@saarthi.gov.in',
      role: 'admin',
      designation: 'Deputy Director (Policy & Data)',
      department: 'Ministry of Electronics & IT',
    };

    const initialSchemes: Scheme[] = [
      {
        id: 'SCH-PM-KISAN-001',
        code: 'PM-KISAN',
        title: 'Pradhan Mantri Kisan Samman Nidhi',
        shortDescription: 'Income support of ₹6,000 per year in three equal installments to all landholding farmer families across the country.',
        detailedOverview: 'PM-KISAN is a Central Sector Scheme with 100% funding from Government of India. It has become operational from 1.12.2018. Under the scheme an income support of ₹6,000/- per year in three equal installments is provided to all land-holding farmer families.',
        sector: 'Agriculture',
        level: 'Central',
        state: 'All India',
        ministry: 'Ministry of Agriculture and Farmers Welfare',
        department: 'Department of Agriculture and Cooperation',
        benefits: [
          'Direct cash benefit of ₹6,000 annually credited directly into bank accounts via DBT',
          'Disbursed in 3 equal four-monthly installments of ₹2,000 each',
          'Financial security to purchase seeds, fertilizers, and farm equipment',
        ],
        financialAssistance: '₹6,000 per year in 3 direct bank transfers',
        rules: [
          {
            id: 'pmk_occ',
            field: 'occupation',
            operator: 'equals',
            value: 'Farmer',
            description: 'Applicant must be an operational farmer / agriculturalist',
            mandatory: true,
          },
          {
            id: 'pmk_land',
            field: 'landHoldingHectares',
            operator: 'less_than_or_equal',
            value: 2.0,
            description: 'Farmer family must possess cultivable landholding under 2.0 hectares',
            mandatory: true,
          },
          {
            id: 'pmk_age',
            field: 'age',
            operator: 'greater_than_or_equal',
            value: 18,
            description: 'Landholder must be an adult aged 18 years or above',
            mandatory: true,
          },
        ],
        exclusions: [
          'Institutional landholders',
          'Farmer families holding constitutional posts',
          'Serving or retired officers and employees of Central/State Government Ministries',
          'Income Tax payees in last assessment year',
        ],
        requiredDocuments: [
          { id: 'doc_aadhaar', name: 'Aadhaar Card', description: 'Mandatory Aadhaar authentication for DBT transfer', mandatory: true, issuingAuthority: 'UIDAI' },
          { id: 'doc_land', name: 'Land Ownership Document (Khasra/Khatauni / RoR)', description: 'Updated Record of Rights proving cultivable land ownership', mandatory: true, issuingAuthority: 'Revenue Department' },
          { id: 'doc_bank', name: 'Aadhaar-Seeded Bank Passbook', description: 'Active bank account linked with NPCI for DBT', mandatory: true, issuingAuthority: 'Commercial / Regional Rural Bank' },
        ],
        applicationProcedure: [
          'Self-registration via PM-KISAN portal or via Common Service Centre (CSC)',
          'Provide Aadhaar number, state, district, and land ownership Khata/Khasra details',
          'Verification by State Nodal Revenue Officer',
          'Direct DBT transfer upon validation',
        ],
        effectiveDates: { isOngoing: true, startDate: '2018-12-01' },
        officialUrl: 'https://pmkisan.gov.in',
        portalHelpline: '155261 / 011-24300606',
        status: 'approved',
        isDemo: false,
        version: 1,
        sourceEvidence: {
          documentId: 'DOC-GAZ-AGRI-2019',
          documentTitle: 'Operational Guidelines of Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
          gazetteNumber: 'No. 1-1/2019-Credit-I',
          gazetteDate: '2019-02-01',
          pageReferences: [3, 4, 7],
          extractedParagraphSnippet: 'Under the scheme an income support of ₹6,000/- per year in three equal installments will be provided to small and marginal landholder farmer families subject to statutory exclusions.',
        },
        createdAt: '2026-01-10T10:00:00.000Z',
        updatedAt: '2026-01-10T10:00:00.000Z',
        approvedAt: '2026-01-10T11:00:00.000Z',
        approvedBy: 'Dr. R. Sharma (Director of Agricultural Credit)',
      },
      {
        id: 'SCH-PM-JAY-002',
        code: 'AB-PMJAY',
        title: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana',
        shortDescription: 'World\'s largest government-funded health assurance scheme providing ₹5 Lakh per family per year for secondary and tertiary care hospitalization.',
        detailedOverview: 'Ayushman Bharat PM-JAY provides health cover of ₹5 Lakh per family per year for secondary and tertiary care hospitalization to over 12 crore poor and vulnerable families (approximately 55 crore beneficiaries) that form the bottom 40% of the Indian population.',
        sector: 'Healthcare',
        level: 'Central',
        state: 'All India',
        ministry: 'Ministry of Health and Family Welfare',
        department: 'National Health Authority (NHA)',
        benefits: [
          'Cashless and paperless access to services for the beneficiary at the point of care',
          'Covers up to 3 days of pre-hospitalization and 15 days post-hospitalization expenses',
          'Over 1,949 medical procedures covered including surgeries, diagnostics, and medications',
          'No restriction on family size, age, or gender',
        ],
        financialAssistance: '₹5,00,000 health cover per family per year',
        rules: [
          {
            id: 'jay_bpl',
            field: 'isBplCardHolder',
            operator: 'is_true',
            value: true,
            description: 'Household must be categorized under SECC 2011 Deprivation Criteria or hold valid State BPL / Ration Card',
            mandatory: true,
          },
          {
            id: 'jay_income',
            field: 'annualIncome',
            operator: 'less_than_or_equal',
            value: 250000,
            description: 'Household annual income must not exceed ₹2,50,000',
            mandatory: false,
          },
        ],
        exclusions: [
          'Families having pucca houses with more than 3 rooms',
          'Households with motorized two/three/four wheelers or agricultural equipment',
          'Government employees or households with monthly income > ₹10,000 in rural / SECC non-deprived',
        ],
        requiredDocuments: [
          { id: 'doc_ayush_aadhaar', name: 'Aadhaar Card or Ration Card', description: 'Primary ID for beneficiary verification', mandatory: true, issuingAuthority: 'UIDAI / Food & Civil Supplies' },
          { id: 'doc_bpl', name: 'SECC 2011 Letter or Ration Card', description: 'Evidence of inclusion in deprivation database', mandatory: true, issuingAuthority: 'State Civil Supplies' },
        ],
        applicationProcedure: [
          'Check eligibility online on mera.pmjay.gov.in or visit any empaneled hospital',
          'Contact Ayushman Mitra at hospital helpdesk with Aadhaar and Ration card',
          'Complete e-KYC biometric verification',
          'Instant generation of Ayushman Golden Card',
        ],
        effectiveDates: { isOngoing: true, startDate: '2018-09-23' },
        officialUrl: 'https://pmjay.gov.in',
        portalHelpline: '14555 / 1800-111-565',
        status: 'approved',
        isDemo: false,
        version: 1,
        sourceEvidence: {
          documentId: 'DOC-GAZ-NHA-2018',
          documentTitle: 'Ayushman Bharat National Health Protection Mission Guidelines',
          gazetteNumber: 'MoHFW-NHPM-2018/14',
          gazetteDate: '2018-09-20',
          pageReferences: [2, 5, 11],
          extractedParagraphSnippet: 'PM-JAY provides financial protection up to 5 Lakh rupees per family per year for secondary and tertiary care hospitalization across public and empaneled private hospitals.',
        },
        createdAt: '2026-01-12T10:00:00.000Z',
        updatedAt: '2026-01-12T10:00:00.000Z',
        approvedAt: '2026-01-12T11:00:00.000Z',
        approvedBy: 'National Health Authority Verification Cell',
      },
      {
        id: 'SCH-PMEGP-003',
        code: 'PMEGP',
        title: 'Prime Minister\'s Employment Generation Programme',
        shortDescription: 'Credit-linked subsidy programme to generate employment opportunities by establishing micro-enterprises in non-farm sectors with subsidies up to 35%.',
        detailedOverview: 'PMEGP is a major credit-linked subsidy scheme administered by the Ministry of MSME through Khadi and Village Industries Commission (KVIC) as the single nodal agency at national level. Project cost up to ₹50 Lakhs for manufacturing units and ₹20 Lakhs for service sector.',
        sector: 'MSME',
        level: 'Central',
        state: 'All India',
        ministry: 'Ministry of Micro, Small and Medium Enterprises',
        department: 'Khadi and Village Industries Commission (KVIC)',
        benefits: [
          'Government subsidy of 15% to 25% for general category and 25% to 35% for special categories (SC/ST/OBC/Women/Minority)',
          'Beneficiary contribution only 5% to 10% of total project cost',
          'Collateral-free loans up to ₹10 Lakhs under CGTMSE cover',
          'Entrepreneurship Development Programme (EDP) training included',
        ],
        financialAssistance: 'Up to 35% margin money subsidy on project cost up to ₹50 Lakhs',
        rules: [
          {
            id: 'pmegp_age',
            field: 'age',
            operator: 'greater_than_or_equal',
            value: 18,
            description: 'Any individual aged 18 years or above is eligible',
            mandatory: true,
          },
          {
            id: 'pmegp_edu',
            field: 'educationStatus',
            operator: 'in',
            value: ['school', 'undergraduate', 'postgraduate', 'vocational'],
            description: 'For projects above ₹10 Lakh in manufacturing and ₹5 Lakh in service, minimum educational qualification is 8th pass / school',
            mandatory: true,
          },
        ],
        exclusions: [
          'Existing units or units that have already availed Government subsidy under any other central/state scheme',
          'Businesses involving meat, intoxicants, or tobacco products',
          'Crop cultivation and direct agriculture (non-farm processing allowed)',
        ],
        requiredDocuments: [
          { id: 'doc_pmegp_id', name: 'Aadhaar Card and PAN Card', description: 'Proof of identity and tax identification', mandatory: true, issuingAuthority: 'UIDAI / Income Tax' },
          { id: 'doc_pmegp_dpr', name: 'Detailed Project Report (DPR)', description: 'Business viability, projected financials, and capital machinery quotes', mandatory: true, issuingAuthority: 'Chartered Accountant or Industry Consultant' },
          { id: 'doc_pmegp_caste', name: 'Category / Caste Certificate', description: 'Required for special category 35% higher subsidy claim', mandatory: false, issuingAuthority: 'Tehsildar / SDO' },
        ],
        applicationProcedure: [
          'Submit online application on KVIC PMEGP e-Portal (kviconline.gov.in/pmegpeportal)',
          'Upload Detailed Project Report (DPR) and identity credentials',
          'District Task Force Committee (DTFC) screening and recommendation to financing bank',
          'Bank sanctions loan and disburses first tranche upon EDP training completion',
        ],
        effectiveDates: { isOngoing: true, startDate: '2008-08-15' },
        officialUrl: 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp',
        portalHelpline: '1800-3000-0034',
        status: 'approved',
        isDemo: false,
        version: 1,
        sourceEvidence: {
          documentId: 'DOC-MSME-PMEGP-2022',
          documentTitle: 'Revised Guidelines for Prime Minister Employment Generation Programme',
          gazetteNumber: 'MSME/PMEGP/Cir/2022-23',
          gazetteDate: '2022-05-13',
          pageReferences: [4, 6, 9],
          extractedParagraphSnippet: 'PMEGP aims to facilitate setting up of micro enterprises in manufacturing and service sectors with margin money assistance up to 35% in rural areas for special categories.',
        },
        createdAt: '2026-01-15T10:00:00.000Z',
        updatedAt: '2026-01-15T10:00:00.000Z',
        approvedAt: '2026-01-15T11:00:00.000Z',
        approvedBy: 'KVIC Joint Secretary (Enterprise)',
      },
      {
        id: 'SCH-VIDYA-004',
        code: 'PM-VIDYALAKSHMI',
        title: 'Pradhan Mantri Vidya Lakshmi Higher Education Scheme',
        shortDescription: 'Collateral-free educational loan and full interest subvention for meritorious students pursuing higher studies in top 860 NIRF-ranked institutions.',
        detailedOverview: 'Approved by Union Cabinet, PM Vidya Lakshmi provides financial support to any youth admitted into higher educational institutions. For students with annual family income up to ₹8 Lakh, 3% interest subvention is offered during the moratorium period.',
        sector: 'Education',
        level: 'Central',
        state: 'All India',
        ministry: 'Ministry of Education',
        department: 'Department of Higher Education',
        benefits: [
          'Collateral-free, guarantor-free education loan up to ₹10 Lakhs',
          '75% credit guarantee by Government of India for defaults up to ₹7.5 Lakh',
          'Full interest subvention for family income up to ₹4.5 Lakh; 3% subvention for income up to ₹8 Lakh',
          'Covers tuition fees, hostel charges, books, and study equipment',
        ],
        financialAssistance: 'Interest subvention on education loans up to ₹10,00,000',
        rules: [
          {
            id: 'vl_edu',
            field: 'educationStatus',
            operator: 'in',
            value: ['undergraduate', 'postgraduate', 'vocational'],
            description: 'Applicant must be enrolled in or admitted to recognized higher education',
            mandatory: true,
          },
          {
            id: 'vl_income',
            field: 'annualIncome',
            operator: 'less_than_or_equal',
            value: 800000,
            description: 'Gross annual parental/family income must not exceed ₹8,00,000 for interest subsidy',
            mandatory: true,
          },
        ],
        exclusions: [
          'Students who have already availed another central government interest subsidy scheme (e.g. CSIS)',
          'Students admitted through management quota without merit ranking',
        ],
        requiredDocuments: [
          { id: 'doc_vl_adm', name: 'Admission Offer Letter / Bonafide Certificate', description: 'Proof of admission into NIRF-ranked higher educational institution', mandatory: true, issuingAuthority: 'College / University Dean' },
          { id: 'doc_vl_inc', name: 'Income Certificate / ITR', description: 'Competent authority certificate validating family income under ₹8 Lakh', mandatory: true, issuingAuthority: 'Revenue Authority / IT Dept' },
          { id: 'doc_vl_acad', name: 'Class 10th and 12th Marksheets', description: 'Academic records for merit appraisal', mandatory: true, issuingAuthority: 'Recognized School Board' },
        ],
        applicationProcedure: [
          'Register on PM-Vidya Lakshmi Unified Student Portal',
          'Select bank and loan scheme with Common Educational Loan Application Form (CELAF)',
          'Digital verification of admission and fee structure through DigiLocker',
          'Direct disbursement to institution bank account',
        ],
        effectiveDates: { isOngoing: true, startDate: '2024-11-06' },
        officialUrl: 'https://www.vidyalakshmi.co.in',
        portalHelpline: '1800-180-2222',
        status: 'approved',
        isDemo: false,
        version: 1,
        sourceEvidence: {
          documentId: 'DOC-CAB-EDU-2024',
          documentTitle: 'Cabinet Decision on PM Vidya Lakshmi Education Loan Support Scheme',
          gazetteNumber: 'PIB-Del-EDU/2024/78',
          gazetteDate: '2024-11-06',
          pageReferences: [1, 2],
          extractedParagraphSnippet: 'The Union Cabinet approves PM Vidya Lakshmi to provide financial support up to 10 Lakh rupees with 75% credit guarantee and interest subvention for students from families with income up to 8 Lakh.',
        },
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:00:00.000Z',
        approvedAt: '2026-01-20T11:00:00.000Z',
        approvedBy: 'Higher Education Commission Reviewer',
      },
      {
        id: 'SCH-PMMVY-005',
        code: 'PMMVY',
        title: 'Pradhan Mantri Matru Vandana Yojana',
        shortDescription: 'Maternity benefit cash incentive of ₹5,000 in two installments for pregnant women and lactating mothers for health and nutritional support.',
        detailedOverview: 'PMMVY is a Centrally Sponsored Scheme aimed at providing partial compensation for wage loss in terms of cash incentive so that the woman can take adequate rest before and after delivery of the first living child, promoting improved health seeking behaviour.',
        sector: 'Healthcare',
        level: 'Central',
        state: 'All India',
        ministry: 'Ministry of Women and Child Development',
        department: 'Mission Shakti - Directorate of Maternal Health',
        benefits: [
          'Cash incentive of ₹5,000 for first child in two installments (₹3,000 at ANC registration + ₹2,000 at child birth/immunization)',
          'Additional incentive of ₹6,000 for second child if girl child to promote child sex ratio',
          'Direct transfer into Aadhaar-seeded Jan Dhan or savings account',
        ],
        financialAssistance: '₹5,000 to ₹6,000 direct cash incentive',
        rules: [
          {
            id: 'pmmvy_gender',
            field: 'gender',
            operator: 'equals',
            value: 'female',
            description: 'Applicant must be a pregnant woman or lactating mother',
            mandatory: true,
          },
          {
            id: 'pmmvy_age',
            field: 'age',
            operator: 'greater_than_or_equal',
            value: 19,
            description: 'Mother must be at least 19 years of age at pregnancy registration',
            mandatory: true,
          },
          {
            id: 'pmmvy_income',
            field: 'annualIncome',
            operator: 'less_than_or_equal',
            value: 800000,
            description: 'Family income must not exceed ₹8,00,000 (priority to SC/ST/Divyangjan/BPL)',
            mandatory: false,
          },
        ],
        exclusions: [
          'Women who are in regular employment with the Central Government or State Governments or Public Sector Undertakings (PSUs)',
          'Those who are in receipt of similar benefits under any law for the time being in force',
        ],
        requiredDocuments: [
          { id: 'doc_mcp', name: 'Mother and Child Protection (MCP) Card', description: 'Issued during early registration at Anganwadi / Health Sub-Center', mandatory: true, issuingAuthority: 'Anganwadi / Primary Health Centre' },
          { id: 'doc_aadhaar_m', name: 'Aadhaar of Mother and Husband', description: 'Identity verification for DBT transfer', mandatory: true, issuingAuthority: 'UIDAI' },
          { id: 'doc_birth', name: 'Child Birth Certificate & Immunization Record', description: 'Required for 2nd installment claim', mandatory: false, issuingAuthority: 'Municipal Registrar' },
        ],
        applicationProcedure: [
          'Register pregnancy at nearest Anganwadi Centre (AWC) or approved health facility within 570 days of LMP',
          'Submit Form 1A with MCP Card details and Aadhaar-seeded bank passbook',
          'Anganwadi Worker / ASHA registers the beneficiary on pmmvy.wcd.gov.in portal',
          'Direct Benefit Transfer upon supervisor validation',
        ],
        effectiveDates: { isOngoing: true, startDate: '2017-01-01' },
        officialUrl: 'https://pmmvy.wcd.gov.in',
        portalHelpline: '011-23382393',
        status: 'approved',
        isDemo: false,
        version: 1,
        sourceEvidence: {
          documentId: 'DOC-WCD-PMMVY-2023',
          documentTitle: 'Mission Shakti Guidelines - Pradhan Mantri Matru Vandana Yojana 2.0',
          gazetteNumber: 'WCD/Mission-Shakti/2023-Maternity',
          gazetteDate: '2023-04-01',
          pageReferences: [3, 8, 14],
          extractedParagraphSnippet: 'Maternity benefits under PMMVY 2.0 are provided to eligible pregnant and lactating mothers to compensate wage loss and encourage healthy nutrition practices.',
        },
        createdAt: '2026-01-22T10:00:00.000Z',
        updatedAt: '2026-01-22T10:00:00.000Z',
        approvedAt: '2026-01-22T11:00:00.000Z',
        approvedBy: 'Directorate of Maternal Child Welfare',
      },
      // CLEARLY LABELED FICTIONAL DEMO SCHEMES FOR TESTING
      {
        id: 'SCH-DEMO-YUVA-006',
        code: 'DEMO-UP-YUVA',
        title: '[DEMO] Mukhyamantri Yuva Udyami Vikas Yojana',
        shortDescription: 'FICTIONAL TEST SCHEME: State-level interest-free working capital loan of ₹2,00,000 for rural youth aged 18 to 35 in Uttar Pradesh.',
        detailedOverview: 'NOTICE: THIS IS A SYNTHETIC FICTIONAL TEST SCHEME CREATED SPECIFICALLY FOR QA DEMONSTRATION AND AUDIT TRAIL TESTING. IT DOES NOT CONFER REAL GOVERNMENT BENEFITS. Synthesized to test state-level residence filters, age caps, and micro-loan eligibility.',
        sector: 'MSME',
        level: 'State',
        state: 'Uttar Pradesh',
        ministry: 'Department of Micro, Small & Medium Enterprises (UP Demo)',
        department: 'Youth Self-Employment Mission (Synthetic)',
        benefits: [
          'Interest-free working capital loan up to ₹2,00,000',
          '3-year repayment tenure with 6-month moratorium',
          'Free digital bookkeeping kit and QR standee',
        ],
        financialAssistance: '₹2,00,000 zero-interest working capital loan (Fictional Demo)',
        rules: [
          {
            id: 'demo_state',
            field: 'state',
            operator: 'equals',
            value: 'Uttar Pradesh',
            description: 'Applicant must be a permanent resident of Uttar Pradesh',
            mandatory: true,
          },
          {
            id: 'demo_age_min',
            field: 'age',
            operator: 'greater_than_or_equal',
            value: 18,
            description: 'Applicant must be at least 18 years of age',
            mandatory: true,
          },
          {
            id: 'demo_age_max',
            field: 'age',
            operator: 'less_than_or_equal',
            value: 35,
            description: 'Applicant must not be older than 35 years',
            mandatory: true,
          },
          {
            id: 'demo_income',
            field: 'annualIncome',
            operator: 'less_than_or_equal',
            value: 300000,
            description: 'Annual family income must not exceed ₹3,00,000',
            mandatory: true,
          },
        ],
        exclusions: ['Defaulters of prior bank loans', 'Full-time government employees'],
        requiredDocuments: [
          { id: 'doc_demo_domicile', name: 'Uttar Pradesh Domicile Certificate', description: 'Proof of residence in UP', mandatory: true, issuingAuthority: 'Tehsildar UP' },
          { id: 'doc_demo_aadhaar', name: 'Aadhaar Card', description: 'Identity and age verification', mandatory: true, issuingAuthority: 'UIDAI' },
        ],
        applicationProcedure: [
          'DEMO ONLY: Submit synthetic test profile in SAARTHI wizard',
          'Select Uttar Pradesh as state and observe deterministic rule validation',
        ],
        effectiveDates: { isOngoing: true, startDate: '2025-01-01' },
        officialUrl: 'https://up.gov.in/demo-testing-portal',
        portalHelpline: 'Demo Portal Testing Helpline: 0522-000000',
        status: 'approved',
        isDemo: true, // EXPLICITLY LABELED DEMO
        version: 1,
        sourceEvidence: {
          documentId: 'DOC-SYNTHETIC-UP-01',
          documentTitle: 'Synthetic Testing Draft: UP Yuva Udyami Rules 2025 (Fictional)',
          gazetteNumber: 'DEMO-UP-2025-X',
          gazetteDate: '2025-01-01',
          pageReferences: [1],
          extractedParagraphSnippet: '[SYNTHETIC BENCHMARK RECORD] Fictional scheme record used for testing multi-parameter rule engines and state boundary enforcement in SAARTHI platform.',
        },
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-02-01T10:00:00.000Z',
        approvedAt: '2026-02-01T11:00:00.000Z',
        approvedBy: 'SAARTHI System Testing QA Lead',
      },
      {
        id: 'SCH-DEMO-TAB-007',
        code: 'DEMO-MH-VIDYA',
        title: '[DEMO] Saraswati Digital Vidya Tablet Scheme',
        shortDescription: 'FICTIONAL TEST SCHEME: Free 10-inch digital learning tablet and 4G data voucher for female STEM college students in Maharashtra.',
        detailedOverview: 'NOTICE: THIS IS A SYNTHETIC FICTIONAL TEST SCHEME CREATED SPECIFICALLY FOR QA DEMONSTRATION AND AUDIT TRAIL TESTING. IT DOES NOT CONFER REAL GOVERNMENT BENEFITS. Demonstrates gender-specific quotas and higher education enrollment rules.',
        sector: 'Education',
        level: 'State',
        state: 'Maharashtra',
        ministry: 'Higher & Technical Education Department (MH Demo)',
        department: 'Directorate of Technical Education (Synthetic)',
        benefits: [
          'Free 10-inch 64GB Android Tablet preloaded with academic e-books',
          '1-year 2GB/day 4G/5G data connectivity SIM card',
          'Access to virtual science and engineering lab simulations',
        ],
        financialAssistance: 'Hardware tablet + ₹12,000 digital connectivity grant (Demo)',
        rules: [
          {
            id: 'tab_state',
            field: 'state',
            operator: 'equals',
            value: 'Maharashtra',
            description: 'Applicant must be domiciled in the State of Maharashtra',
            mandatory: true,
          },
          {
            id: 'tab_gender',
            field: 'gender',
            operator: 'equals',
            value: 'female',
            description: 'Scheme is exclusively reserved for female students',
            mandatory: true,
          },
          {
            id: 'tab_edu',
            field: 'educationStatus',
            operator: 'in',
            value: ['undergraduate', 'postgraduate'],
            description: 'Applicant must be actively enrolled in Undergraduate or Postgraduate college',
            mandatory: true,
          },
          {
            id: 'tab_income',
            field: 'annualIncome',
            operator: 'less_than_or_equal',
            value: 400000,
            description: 'Annual family income must be under ₹4,00,000',
            mandatory: true,
          },
        ],
        exclusions: ['Students who have previously received a government laptop/tablet within past 3 years'],
        requiredDocuments: [
          { id: 'doc_mh_dom', name: 'Maharashtra Domicile Certificate', description: 'Valid proof of MH residency', mandatory: true, issuingAuthority: 'Collector Office Maharashtra' },
          { id: 'doc_clg_id', name: 'College STEM Enrollment Certificate', description: 'Certified by College Principal', mandatory: true, issuingAuthority: 'Affiliated University College' },
        ],
        applicationProcedure: [
          'DEMO ONLY: Test by selecting Maharashtra + Female + Undergraduate in Profile Wizard',
          'Verify deterministic eligibility calculation and document checklist',
        ],
        effectiveDates: { isOngoing: true, startDate: '2025-06-01' },
        officialUrl: 'https://maharashtra.gov.in/demo-saraswati-tablet',
        portalHelpline: 'Demo QA Support: 022-000000',
        status: 'approved',
        isDemo: true, // EXPLICITLY LABELED DEMO
        version: 1,
        sourceEvidence: {
          documentId: 'DOC-SYNTHETIC-MH-02',
          documentTitle: 'Synthetic Policy Draft: MH Saraswati Tablet Scheme 2025 (Fictional)',
          gazetteNumber: 'DEMO-MH-2025-DTE',
          gazetteDate: '2025-06-01',
          pageReferences: [1, 2],
          extractedParagraphSnippet: '[SYNTHETIC BENCHMARK RECORD] Fictional educational welfare initiative designed to validate multi-tiered conditional filters on state residency and gender.',
        },
        createdAt: '2026-02-05T10:00:00.000Z',
        updatedAt: '2026-02-05T10:00:00.000Z',
        approvedAt: '2026-02-05T11:00:00.000Z',
        approvedBy: 'SAARTHI System Testing QA Lead',
      },
    ];

    this.schemes = initialSchemes;

    // Seed versions for initial schemes
    this.versions = {};
    for (const scheme of initialSchemes) {
      this.versions[scheme.id] = [
        {
          version: 1,
          updatedAt: scheme.createdAt,
          updatedBy: scheme.approvedBy || defaultActor.name,
          changeSummary: 'Official baseline gazette ingestion and verification.',
          snapshot: {
            title: scheme.title,
            level: scheme.level,
            state: scheme.state,
            sector: scheme.sector,
            status: scheme.status,
            rulesCount: scheme.rules.length,
          },
        },
      ];
    }

    // Seed initial documents
    this.documents = [
      {
        id: 'DOC-GAZ-AGRI-2019',
        filename: 'PM-KISAN-Operational-Guidelines-2019.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        uploadedAt: '2026-01-10T09:30:00.000Z',
        uploadedBy: 'registrar@saarthi.gov.in',
        pageCount: 16,
        gazetteNumber: 'No. 1-1/2019-Credit-I',
        extractedText: 'Operational Guidelines of Pradhan Mantri Kisan Samman Nidhi (PM-KISAN). The Scheme aims to provide income support of ₹6,000 per year to landholding farmer families...',
        pageTexts: [
          { page: 1, text: 'Government of India, Ministry of Agriculture and Farmers Welfare. PM-KISAN Operational Guidelines.' },
          { page: 2, text: 'Definition of beneficiary family: Farmer family comprising of husband, wife and minor children who own cultivable land.' },
          { page: 3, text: 'Exclusion Categories: Institutional landholders, constitutional post holders, income tax payees.' },
        ],
        status: 'draft_generated',
        generatedSchemeId: 'SCH-PM-KISAN-001',
      },
      {
        id: 'DOC-GAZ-NHA-2018',
        filename: 'AB-PMJAY-Framework-Notification-2018.pdf',
        fileSize: 2097152,
        mimeType: 'application/pdf',
        uploadedAt: '2026-01-12T09:15:00.000Z',
        uploadedBy: 'nha.officer@saarthi.gov.in',
        pageCount: 32,
        gazetteNumber: 'MoHFW-NHPM-2018/14',
        extractedText: 'National Health Protection Scheme Ayushman Bharat PM-JAY. Hospitalization benefit of ₹5,00,000 per year per family for secondary and tertiary care...',
        pageTexts: [
          { page: 1, text: 'Ministry of Health and Family Welfare, Government of India. PM-JAY Operational Manual.' },
          { page: 5, text: 'Target Beneficiaries: Based on SECC 2011 rural deprivation criteria D1 through D7 and urban occupational categories.' },
        ],
        status: 'draft_generated',
        generatedSchemeId: 'SCH-PM-JAY-002',
      },
    ];

    // Seed initial audit trail
    this.auditLogs = [
      {
        id: 'AUD-001',
        timestamp: '2026-01-10T09:30:00.000Z',
        actor: defaultActor,
        action: 'DOCUMENT_UPLOADED',
        targetId: 'DOC-GAZ-AGRI-2019',
        targetType: 'document',
        summary: 'Uploaded official PM-KISAN operational circular PDF.',
      },
      {
        id: 'AUD-002',
        timestamp: '2026-01-10T09:35:00.000Z',
        actor: defaultActor,
        action: 'AI_EXTRACTION_COMPLETED',
        targetId: 'DOC-GAZ-AGRI-2019',
        targetType: 'document',
        summary: 'Gemini extracted structured scheme draft with 3 deterministic rules and 3 required documents.',
      },
      {
        id: 'AUD-003',
        timestamp: '2026-01-10T11:00:00.000Z',
        actor: defaultActor,
        action: 'SCHEME_APPROVED',
        targetId: 'SCH-PM-KISAN-001',
        targetType: 'scheme',
        summary: 'Verified and approved PM-KISAN for citizen access.',
      },
      {
        id: 'AUD-004',
        timestamp: '2026-01-12T11:00:00.000Z',
        actor: defaultActor,
        action: 'SCHEME_APPROVED',
        targetId: 'SCH-PM-JAY-002',
        targetType: 'scheme',
        summary: 'Verified and approved Ayushman Bharat PM-JAY for citizen access.',
      },
      {
        id: 'AUD-005',
        timestamp: '2026-02-01T11:00:00.000Z',
        actor: defaultActor,
        action: 'SCHEME_APPROVED',
        targetId: 'SCH-DEMO-YUVA-006',
        targetType: 'scheme',
        summary: 'Approved [DEMO] Mukhyamantri Yuva Udyami Vikas Yojana for synthetic test evaluation.',
      },
    ];

    this.persist();
  }
}
