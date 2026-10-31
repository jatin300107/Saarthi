import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Storage } from './storage';
import { RulesEngine } from './rulesEngine';
import { GeminiService } from './geminiService';
import {
  authenticateOptional,
  authenticateRequired,
  generateToken,
  requireAdmin,
  requireReviewerOrAdmin,
  requireRole,
} from './auth';
import {
  AuthUser,
  CitizenProfile,
  SchemeSector,
  SchemeStatus,
  UserRole,
} from './types';

export const apiRouter = express.Router();

export const apiApp = express();
apiApp.use(express.json({ limit: '50mb' }));
apiApp.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Defensive header cleanup: Never allow client-supplied x-saarthi-role to reach route handlers
apiApp.use((req, res, next) => {
  if (req.headers['x-saarthi-role']) {
    delete req.headers['x-saarthi-role'];
  }
  next();
});

apiApp.use('/api', apiRouter);

/**
 * Health check
 */
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SAARTHI Backend API',
    version: '2.0.0 (Secure RBAC)',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    authStrategy: 'Server-Verified Bearer JWT & Server Database Roles',
  });
});

/**
 * 1. AUTHENTICATION: Self-Registration
 * Security rule: Anyone can register, but the server STRICTLY enforces the 'citizen' role.
 * Attempts to register as 'admin' or 'reviewer' are disregarded to prevent privilege escalation.
 */
apiRouter.post('/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = Storage.getUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email is already registered. Please sign in.',
      });
    }

    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(password, saltRounds);

    // Enforce role: 'citizen' — ordinary registration NEVER assigns elevated privileges!
    const newUser = Storage.createUser({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'citizen',
      designation: 'Citizen Beneficiary',
      department: 'General Public',
    });

    const token = generateToken(newUser);

    // Audit log
    Storage.addAuditLog({
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      action: 'USER_REGISTERED',
      targetId: newUser.id,
      targetType: 'user',
      summary: `New citizen account registered: ${newUser.name} (${newUser.email}).`,
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        designation: newUser.designation,
        department: newUser.department,
      },
      message: 'Citizen account created successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

/**
 * 2. AUTHENTICATION: Sign In
 * Validates credentials using server-side bcrypt compare and returns signed JWT token.
 */
apiRouter.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = Storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'No account found with this email or invalid password.',
      });
    }

    const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Incorrect password provided.',
      });
    }

    const token = generateToken(user);

    // Audit log
    Storage.addAuditLog({
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      action: 'USER_LOGGED_IN',
      targetId: user.id,
      targetType: 'user',
      summary: `User signed in: ${user.name} (${user.role}).`,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
      },
      message: 'Authentication successful.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

/**
 * 3. AUTHENTICATION: Get current authenticated user profile
 */
apiRouter.get('/auth/me', authenticateRequired, (req, res) => {
  res.json({ user: req.user });
});

/**
 * 4. ADMIN USER MANAGEMENT: List all system users (Admin only)
 */
apiRouter.get('/users', requireAdmin, (req, res) => {
  try {
    const users = Storage.getUsers().map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      designation: u.designation,
      department: u.department,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve users', message: error.message });
  }
});

/**
 * 5. ADMIN USER MANAGEMENT: Update user role (Admin only)
 * Privilege escalation prevention: Only administrators can assign or alter user roles.
 */
apiRouter.patch('/users/:id/role', requireAdmin, (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles: UserRole[] = ['citizen', 'reviewer', 'admin'];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: `Role must be one of: ${allowedRoles.join(', ')}.`,
      });
    }

    const updated = Storage.updateUserRole(req.params.id, role, req.user!);
    res.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        designation: updated.designation,
        department: updated.department,
      },
      message: `User role successfully updated to ${role}.`,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user role', message: error.message });
  }
});

/**
 * 6. SCHEMES: List schemes with role-aware filtering
 * Unauthenticated guests and citizens can ONLY view approved schemes.
 * Reviewers and Admins can view drafts, under_review, and rejected schemes.
 */
apiRouter.get('/schemes', authenticateOptional, (req, res) => {
  try {
    const userRole = req.user?.role || 'citizen';
    const sector = req.query.sector as SchemeSector | undefined;
    const requestedStatus = req.query.status as SchemeStatus | undefined;
    const search = req.query.search as string | undefined;
    const state = req.query.state as string | undefined;
    const level = req.query.level as string | undefined;

    // Strict boundary: Non-officials can NEVER see unapproved schemes
    const status = userRole === 'citizen' ? 'approved' : requestedStatus;

    const schemes = Storage.getSchemes({
      sector,
      status,
      search,
      state,
      level,
    });

    res.json({ schemes, total: schemes.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve schemes', message: error.message });
  }
});

/**
 * 7. SCHEMES: Get single scheme with versions and evidence
 * Strict Draft Disclosure Protection:
 * Drafts, under_review, or rejected schemes return 403 Forbidden to citizens and guests.
 */
apiRouter.get('/schemes/:id', authenticateOptional, (req, res) => {
  try {
    const userRole = req.user?.role || 'citizen';
    const scheme = Storage.getSchemeById(req.params.id);

    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found', id: req.params.id });
    }

    if (scheme.status !== 'approved' && userRole === 'citizen') {
      return res.status(403).json({
        error: 'Access Denied',
        code: 'DRAFT_SCHEME_RESTRICTED',
        message: 'This scheme draft has not yet been approved for public release. Verification officer credentials required.',
      });
    }

    const versions = Storage.getVersions(scheme.id);
    res.json({ scheme, versions });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve scheme', message: error.message });
  }
});

/**
 * 8. SCHEMES: Create a new scheme draft (Reviewers & Admins only)
 */
apiRouter.post('/schemes', requireReviewerOrAdmin, (req, res) => {
  try {
    const actor = req.user!;
    const data = req.body;

    if (!data.title || !data.sector || !data.level) {
      return res.status(400).json({ error: 'Missing required fields: title, sector, and level are mandatory.' });
    }

    const newScheme = Storage.createScheme(
      {
        code: data.code || `SCH-${Math.floor(1000 + Math.random() * 9000)}`,
        title: data.title,
        shortDescription: data.shortDescription || '',
        detailedOverview: data.detailedOverview || '',
        sector: data.sector,
        level: data.level,
        state: data.state || 'All India',
        ministry: data.ministry || 'Ministry of Public Welfare',
        department: data.department || '',
        benefits: Array.isArray(data.benefits) ? data.benefits : [],
        financialAssistance: data.financialAssistance || '',
        rules: Array.isArray(data.rules) ? data.rules : [],
        exclusions: Array.isArray(data.exclusions) ? data.exclusions : [],
        requiredDocuments: Array.isArray(data.requiredDocuments) ? data.requiredDocuments : [],
        applicationProcedure: Array.isArray(data.applicationProcedure) ? data.applicationProcedure : [],
        effectiveDates: data.effectiveDates || { isOngoing: true },
        officialUrl: data.officialUrl || 'https://www.india.gov.in',
        portalHelpline: data.portalHelpline || '',
        status: data.status || 'draft',
        isDemo: Boolean(data.isDemo),
        sourceEvidence: data.sourceEvidence,
      },
      actor
    );

    res.status(201).json({ scheme: newScheme });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create scheme', message: error.message });
  }
});

/**
 * 9. SCHEMES: Update an existing scheme (Reviewers & Admins only)
 */
apiRouter.put('/schemes/:id', requireReviewerOrAdmin, (req, res) => {
  try {
    const actor = req.user!;
    const updates = req.body;
    const changeSummary = req.body.changeSummary || 'Reviewer modifications to scheme parameters';

    const updated = Storage.updateScheme(req.params.id, updates, actor, changeSummary);
    res.json({ scheme: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update scheme', message: error.message });
  }
});

/**
 * 10. SCHEMES: Approve scheme draft for citizen publication (Reviewers & Admins only)
 */
apiRouter.post('/schemes/:id/approve', requireReviewerOrAdmin, (req, res) => {
  try {
    const actor = req.user!;
    const approved = Storage.approveScheme(req.params.id, actor);
    res.json({ scheme: approved, message: 'Scheme approved and published successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Approval failed', message: error.message });
  }
});

/**
 * 11. SCHEMES: Reject scheme draft with specific reason (Reviewers & Admins only)
 */
apiRouter.post('/schemes/:id/reject', requireReviewerOrAdmin, (req, res) => {
  try {
    const actor = req.user!;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A specific reason is required to reject a scheme draft.' });
    }

    const rejected = Storage.rejectScheme(req.params.id, reason.trim(), actor);
    res.json({ scheme: rejected, message: 'Scheme draft rejected.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Rejection failed', message: error.message });
  }
});

/**
 * 12. DOCUMENTS: Ingest document (Reviewers & Admins only)
 * Citizens can NEVER access document ingestion.
 */
apiRouter.post('/documents/upload', requireReviewerOrAdmin, async (req, res) => {
  try {
    const actor = req.user!;
    const { filename, rawText, pdfBase64, fileSize, isDemo } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    if (!rawText && !pdfBase64) {
      return res.status(400).json({
        error: 'Document content is missing',
        message: 'Please provide either rawText content or pdfBase64 data.',
      });
    }

    const docId = `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let textContent = rawText || '';
    const pageTexts: { page: number; text: string }[] = [];

    if (textContent) {
      const rawPages = textContent.split(/--- Page \d+ ---|\f/);
      if (rawPages.length > 1) {
        rawPages.forEach((p: string, idx: number) => {
          if (p.trim()) pageTexts.push({ page: idx + 1, text: p.trim() });
        });
      } else {
        pageTexts.push({ page: 1, text: textContent });
      }
    } else {
      pageTexts.push({ page: 1, text: `Binary PDF ingested: ${filename}` });
      textContent = `Binary PDF ingested: ${filename}`;
    }

    let extraction;
    try {
      extraction = await GeminiService.extractSchemeFromDocument(textContent, filename, pdfBase64);
    } catch (err: any) {
      return res.status(422).json({
        error: 'Document extraction failed',
        message: `OCR / AI extraction could not parse the document: ${err.message}`,
      });
    }

    const documentRecord = Storage.addDocument(
      {
        id: docId,
        filename,
        fileSize: fileSize || (pdfBase64 ? Math.round((pdfBase64.length * 3) / 4) : textContent.length),
        mimeType: pdfBase64 ? 'application/pdf' : 'text/plain',
        uploadedAt: new Date().toISOString(),
        uploadedBy: actor.email,
        pageCount: pageTexts.length || 1,
        extractedText: textContent,
        pageTexts,
        status: 'draft_generated',
      },
      actor
    );

    const draftScheme = Storage.createScheme(
      {
        code: extraction.code || `EXT-${Date.now().toString().slice(-4)}`,
        title: extraction.title,
        shortDescription: extraction.shortDescription,
        detailedOverview: extraction.detailedOverview,
        sector: extraction.sector,
        level: extraction.level,
        state: extraction.state || 'All India',
        ministry: extraction.ministry,
        department: extraction.department,
        benefits: extraction.benefits,
        financialAssistance: extraction.financialAssistance,
        rules: extraction.rules.map((r, idx) => ({
          id: `rule_ext_${idx + 1}`,
          field: r.field,
          operator: r.operator,
          value: r.value,
          description: r.description,
          mandatory: r.mandatory,
        })),
        exclusions: extraction.exclusions,
        requiredDocuments: extraction.requiredDocuments.map((d, idx) => ({
          id: `doc_req_${idx + 1}`,
          name: d.name,
          description: d.description,
          mandatory: d.mandatory,
          issuingAuthority: d.issuingAuthority,
        })),
        applicationProcedure: extraction.applicationProcedure,
        effectiveDates: { isOngoing: true },
        officialUrl: extraction.officialUrl || 'https://www.india.gov.in',
        status: 'under_review',
        isDemo: Boolean(isDemo),
        sourceEvidence: {
          documentId: docId,
          documentTitle: filename,
          pageReferences: extraction.pageReferences || [1],
          extractedParagraphSnippet: extraction.sourceSnippet || textContent.slice(0, 300),
        },
      },
      actor
    );

    Storage.updateDocument(docId, { generatedSchemeId: draftScheme.id });

    res.status(201).json({
      document: documentRecord,
      schemeDraft: draftScheme,
      extractionConfidence: extraction.confidence || 85,
      message: 'Document successfully ingested and structured draft created for review.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Ingestion pipeline error', message: error.message });
  }
});

/**
 * 13. DOCUMENTS: List ingested documents (Reviewers & Admins only)
 */
apiRouter.get('/documents', requireReviewerOrAdmin, (req, res) => {
  try {
    const documents = Storage.getDocuments();
    res.json({ documents });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve documents', message: error.message });
  }
});

/**
 * 14. DOCUMENTS: Get document details by ID (Reviewers & Admins only)
 */
apiRouter.get('/documents/:id', requireReviewerOrAdmin, (req, res) => {
  try {
    const doc = Storage.getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ document: doc });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve document', message: error.message });
  }
});

/**
 * 15. ELIGIBILITY: Deterministic rule evaluation
 * Evaluates citizen profile against approved schemes ONLY.
 */
apiRouter.post('/eligibility/evaluate', authenticateOptional, (req, res) => {
  try {
    const profile: CitizenProfile = req.body.profile;

    if (!profile || !profile.state) {
      return res.status(400).json({
        error: 'Invalid profile',
        message: 'Citizen profile with at least state residency is required.',
      });
    }

    const allApprovedSchemes = Storage.getSchemes({ status: 'approved' });
    const evaluations = RulesEngine.evaluateAll(allApprovedSchemes, profile);

    const eligible = evaluations.filter((e) => e.status === 'eligible');
    const insufficient = evaluations.filter((e) => e.status === 'insufficient_info');
    const ineligible = evaluations.filter((e) => e.status === 'ineligible');

    const actor: AuthUser = req.user || {
      id: 'citizen_guest',
      name: 'Guest Citizen',
      email: 'citizen.guest@saarthi.portal',
      role: 'citizen',
    };

    Storage.addAuditLog({
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'ELIGIBILITY_EVALUATION_PERFORMED',
      targetId: 'citizen_query',
      targetType: 'citizen_query',
      summary: `Evaluated eligibility across ${allApprovedSchemes.length} approved schemes for ${profile.state} citizen (${eligible.length} eligible, ${insufficient.length} pending info).`,
      details: {
        state: profile.state,
        age: profile.age,
        eligibleCount: eligible.length,
        insufficientCount: insufficient.length,
        ineligibleCount: ineligible.length,
      },
    });

    res.json({
      summary: {
        totalEvaluated: allApprovedSchemes.length,
        eligibleCount: eligible.length,
        insufficientCount: insufficient.length,
        ineligibleCount: ineligible.length,
      },
      results: {
        eligible,
        insufficient,
        ineligible,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Eligibility evaluation error', message: error.message });
  }
});

/**
 * 16. ELIGIBILITY: Plain-language AI explanation of deterministic results
 * Guard: If the requested scheme is a draft, only reviewers or admins can inspect explanations.
 */
apiRouter.post('/eligibility/explain', authenticateOptional, async (req, res) => {
  try {
    const { schemeId, profile, evaluation } = req.body;
    const userRole = req.user?.role || 'citizen';

    if (!schemeId || !profile || !evaluation) {
      return res.status(400).json({ error: 'Missing required parameters: schemeId, profile, and evaluation' });
    }

    const scheme = Storage.getSchemeById(schemeId);
    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found' });
    }

    if (scheme.status !== 'approved' && userRole === 'citizen') {
      return res.status(403).json({
        error: 'Access Denied',
        code: 'DRAFT_SCHEME_RESTRICTED',
        message: 'Cannot generate public explanations for unapproved scheme drafts.',
      });
    }

    const preferredModel = req.body.preferredModel || 'gemini-3.8-flash';
    const result = await GeminiService.generatePlainLanguageExplanation(scheme, profile, evaluation, preferredModel);
    res.json({ explanation: result.explanation, modelUsed: result.modelUsed });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate explanation', message: error.message });
  }
});

/**
 * 17. CHAT: Scheme-Specific AI Chatbot Assistant
 * Strict Draft Disclosure Protection:
 * Unapproved drafts cannot be queried by citizen or guest users.
 */
apiRouter.post('/schemes/:id/chat', authenticateOptional, async (req, res) => {
  try {
    const { id } = req.params;
    const { messages, userProfile, preferredModel } = req.body;
    const userRole = req.user?.role || 'citizen';

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const scheme = Storage.getSchemeById(id);
    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found.' });
    }

    if (scheme.status !== 'approved' && userRole === 'citizen') {
      return res.status(403).json({
        error: 'Access Denied',
        code: 'DRAFT_SCHEME_RESTRICTED',
        message: 'Chat assistance is restricted to approved public schemes.',
      });
    }

    const modelToUse = preferredModel || 'gemini-3.8-flash';
    const result = await GeminiService.chatAboutScheme(scheme, messages, userProfile, modelToUse);

    res.json({
      reply: result.reply,
      modelUsed: result.modelUsed,
      schemeId: scheme.id,
      schemeCode: scheme.code,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Scheme chat error', message: error.message });
  }
});

/**
 * 18. AUDIT: Retrieve audit trail logs (Reviewers and Admins only)
 */
apiRouter.get('/audit', requireReviewerOrAdmin, (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const logs = Storage.getAuditLogs(limit);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve audit log', message: error.message });
  }
});

/**
 * 19. ADMIN DESTRUCTIVE OPERATION: Reset and re-seed database
 * RESTRICTED EXCLUSIVELY TO ADMINISTRATORS (requireAdmin).
 * Neither citizens NOR reviewers can perform database resets.
 */
apiRouter.post('/admin/reset-db', requireAdmin, (req, res) => {
  try {
    Storage.seedInitialData();
    Storage.addAuditLog({
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor: req.user!,
      action: 'DATABASE_RESET_TO_DEMO',
      targetId: 'system_storage',
      targetType: 'system',
      summary: `Administrator ${req.user!.name} reset the database to baseline schemes, documents, and audit history.`,
    });
    res.json({ message: 'Database reset to baseline schemes, documents, and audit history by administrator.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Reset failed', message: error.message });
  }
});

// Legacy alias for demo reset backward compatibility — also strictly requireAdmin!
apiRouter.post('/demo/reset', requireAdmin, (req, res) => {
  try {
    Storage.seedInitialData();
    res.json({ message: 'Database reset to baseline schemes, documents, and audit history.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Reset failed', message: error.message });
  }
});
