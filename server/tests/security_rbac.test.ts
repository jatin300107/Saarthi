/**
 * SAARTHI Security & RBAC Test Suite
 * Validates authentication, authorization matrix, forged role header resistance,
 * privilege escalation prevention, draft disclosure protection, and destructive operations guard.
 */

import http from 'http';
import { apiApp } from '../api';
import { Storage } from '../storage';

const PORT = 3099;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, testName: string, category: string, details?: string) {
  if (condition) {
    results.push({ name: testName, category, passed: true, details });
    console.log(`  ✓ [PASS] [${category}] ${testName}`);
  } else {
    results.push({ name: testName, category, passed: false, details: `Assertion failed. ${details || ''}` });
    console.error(`  ✗ [FAIL] [${category}] ${testName} - ${details || ''}`);
  }
}

async function request(path: string, options: RequestInit = {}): Promise<{ status: number; data: any; headers: Headers }> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let data: any = {};
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return { status: res.status, data, headers: res.headers };
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('  STARTING SAARTHI AUTHENTICATION & RBAC SECURITY TEST SUITE  ');
  console.log('===============================================================\n');

  // Initialize storage
  Storage.initialize();

  // Start ephemeral test server
  const server = http.createServer(apiApp);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));

  try {
    // -------------------------------------------------------------
    // CATEGORY 1: NORMAL ACCESS PER ROLE
    // -------------------------------------------------------------
    console.log('\n-- Category 1: Normal Role-Based Operations --');

    // 1.1 Public unauthenticated access to schemes
    const pubSchemesRes = await request('/schemes');
    assert(
      pubSchemesRes.status === 200 && Array.isArray(pubSchemesRes.data.schemes),
      'Unauthenticated public can retrieve schemes catalog',
      'Normal Access',
      `Status: ${pubSchemesRes.status}`
    );
    const nonApproved = pubSchemesRes.data.schemes.filter((s: any) => s.status !== 'approved');
    assert(
      nonApproved.length === 0,
      'Unauthenticated public only sees approved schemes (0 drafts leaked)',
      'Normal Access',
      `Found ${nonApproved.length} unapproved schemes`
    );

    // 1.2 Sign in as Citizen
    const citizenLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'citizen@saarthi.gov.in', password: 'CitizenPassword@123' }),
    });
    assert(
      citizenLogin.status === 200 && Boolean(citizenLogin.data.token),
      'Citizen can sign in and receive cryptographic JWT token',
      'Normal Access'
    );
    const citizenToken = citizenLogin.data.token;

    // Verify /auth/me for citizen
    const citizenMe = await request('/auth/me', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(
      citizenMe.status === 200 && citizenMe.data.user.role === 'citizen',
      'Citizen session correctly reports server role "citizen"',
      'Normal Access'
    );

    // 1.3 Sign in as Reviewer
    const reviewerLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'reviewer@saarthi.gov.in', password: 'ReviewerPassword@123' }),
    });
    assert(
      reviewerLogin.status === 200 && Boolean(reviewerLogin.data.token),
      'Reviewer can sign in with officer credentials',
      'Normal Access'
    );
    const reviewerToken = reviewerLogin.data.token;

    const reviewerMe = await request('/auth/me', {
      headers: { Authorization: `Bearer ${reviewerToken}` },
    });
    assert(
      reviewerMe.status === 200 && reviewerMe.data.user.role === 'reviewer',
      'Reviewer session correctly reports server role "reviewer"',
      'Normal Access'
    );

    // 1.4 Reviewer can access documents
    const reviewerDocs = await request('/documents', {
      headers: { Authorization: `Bearer ${reviewerToken}` },
    });
    assert(
      reviewerDocs.status === 200 && Array.isArray(reviewerDocs.data.documents),
      'Reviewer can access verification documents list',
      'Normal Access'
    );

    // 1.5 Sign in as Admin
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@saarthi.gov.in', password: 'AdminPassword@123' }),
    });
    assert(
      adminLogin.status === 200 && Boolean(adminLogin.data.token),
      'Admin can sign in with administrative credentials',
      'Normal Access'
    );
    const adminToken = adminLogin.data.token;

    const adminMe = await request('/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminMe.status === 200 && adminMe.data.user.role === 'admin',
      'Admin session correctly reports server role "admin"',
      'Normal Access'
    );

    // -------------------------------------------------------------
    // CATEGORY 2: UNAUTHENTICATED DIRECT API REQUESTS (401 EXPECTED)
    // -------------------------------------------------------------
    console.log('\n-- Category 2: Direct API Requests Without Auth (401 Expected) --');

    const unauthMe = await request('/auth/me');
    assert(unauthMe.status === 401, 'GET /api/auth/me returns 401 when unauthenticated', 'Unauthenticated 401');

    const unauthUpload = await request('/documents/upload', {
      method: 'POST',
      body: JSON.stringify({ filename: 'test.pdf', rawText: 'Test circular' }),
    });
    assert(unauthUpload.status === 401, 'POST /api/documents/upload returns 401 when unauthenticated', 'Unauthenticated 401');

    const unauthCreateScheme = await request('/schemes', {
      method: 'POST',
      body: JSON.stringify({ title: 'Rogue Scheme', sector: 'Agriculture', level: 'Central' }),
    });
    assert(unauthCreateScheme.status === 401, 'POST /api/schemes returns 401 when unauthenticated', 'Unauthenticated 401');

    const unauthDocs = await request('/documents');
    assert(unauthDocs.status === 401, 'GET /api/documents returns 401 when unauthenticated', 'Unauthenticated 401');

    const unauthAudit = await request('/audit');
    assert(unauthAudit.status === 401, 'GET /api/audit returns 401 when unauthenticated', 'Unauthenticated 401');

    const unauthReset = await request('/admin/reset-db', { method: 'POST' });
    assert(unauthReset.status === 401, 'POST /api/admin/reset-db returns 401 when unauthenticated', 'Unauthenticated 401');

    const unauthUsers = await request('/users');
    assert(unauthUsers.status === 401, 'GET /api/users returns 401 when unauthenticated', 'Unauthenticated 401');

    const invalidTokenRes = await request('/auth/me', {
      headers: { Authorization: 'Bearer forged.bogus.jwttoken' },
    });
    assert(invalidTokenRes.status === 401, 'Invalid/forged JWT signature rejected with 401', 'Unauthenticated 401');

    // -------------------------------------------------------------
    // CATEGORY 3: FORGED ROLE HEADER ATTACKS (x-saarthi-role Ignored)
    // -------------------------------------------------------------
    console.log('\n-- Category 3: Forged Role Header Attacks (x-saarthi-role Ignored) --');

    // Test 3.1: Unauthenticated request with x-saarthi-role: admin attempting document upload
    const spoofUnauthUpload = await request('/documents/upload', {
      method: 'POST',
      headers: { 'x-saarthi-role': 'admin' },
      body: JSON.stringify({ filename: 'spoofed.pdf', rawText: 'Hacked circular' }),
    });
    assert(
      spoofUnauthUpload.status === 401,
      'Unauthenticated request with x-saarthi-role: admin to /documents/upload rejected with 401',
      'Header Spoof Resistance',
      `Got status: ${spoofUnauthUpload.status}`
    );

    // Test 3.2: Unauthenticated request with x-saarthi-role: admin attempting DB reset
    const spoofUnauthReset = await request('/admin/reset-db', {
      method: 'POST',
      headers: { 'x-saarthi-role': 'admin' },
    });
    assert(
      spoofUnauthReset.status === 401,
      'Unauthenticated request with x-saarthi-role: admin to /admin/reset-db rejected with 401',
      'Header Spoof Resistance',
      `Got status: ${spoofUnauthReset.status}`
    );

    // Test 3.3: Authenticated Citizen token with x-saarthi-role: admin attempting document upload
    const spoofCitizenUpload = await request('/documents/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        'x-saarthi-role': 'admin',
      },
      body: JSON.stringify({ filename: 'citizen_exploit.pdf', rawText: 'Citizen uploaded' }),
    });
    assert(
      spoofCitizenUpload.status === 403,
      'Citizen token with forged x-saarthi-role: admin to /documents/upload rejected with 403 Forbidden',
      'Header Spoof Resistance',
      `Got status: ${spoofCitizenUpload.status}`
    );

    // Test 3.4: Authenticated Citizen token with x-saarthi-role: admin attempting DB reset
    const spoofCitizenReset = await request('/admin/reset-db', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        'x-saarthi-role': 'admin',
      },
    });
    assert(
      spoofCitizenReset.status === 403,
      'Citizen token with forged x-saarthi-role: admin to /admin/reset-db rejected with 403 Forbidden',
      'Header Spoof Resistance',
      `Got status: ${spoofCitizenReset.status}`
    );

    // Test 3.5: Authenticated Citizen token with x-saarthi-role: reviewer attempting to view audit trail
    const spoofCitizenAudit = await request('/audit', {
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        'x-saarthi-role': 'reviewer',
      },
    });
    assert(
      spoofCitizenAudit.status === 403,
      'Citizen token with forged x-saarthi-role: reviewer to /audit rejected with 403 Forbidden',
      'Header Spoof Resistance',
      `Got status: ${spoofCitizenAudit.status}`
    );

    // Test 3.6: Reviewer token with forged x-saarthi-role: admin attempting DB reset
    const spoofReviewerReset = await request('/admin/reset-db', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${reviewerToken}`,
        'x-saarthi-role': 'admin',
      },
    });
    assert(
      spoofReviewerReset.status === 403,
      'Reviewer token with forged x-saarthi-role: admin to /admin/reset-db rejected with 403 Forbidden',
      'Header Spoof Resistance',
      `Got status: ${spoofReviewerReset.status}`
    );

    // -------------------------------------------------------------
    // CATEGORY 4: PRIVILEGE ESCALATION ATTEMPTS
    // -------------------------------------------------------------
    console.log('\n-- Category 4: Privilege Escalation Prevention --');

    // 4.1 Attacker registers passing role: "admin" in payload
    const attackerEmail = `attacker_${Date.now()}@test.org`;
    const regEscalation = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Malicious User',
        email: attackerEmail,
        password: 'HackerPassword@123',
        role: 'admin', // Exploitative attempt!
      }),
    });
    assert(
      regEscalation.status === 201,
      'Registration succeeds but role assignment must be strictly sanitized',
      'Privilege Escalation'
    );
    assert(
      regEscalation.data.user.role === 'citizen',
      'Self-registration forced to role "citizen" even when attacker passed role="admin"',
      'Privilege Escalation',
      `Assigned role was: ${regEscalation.data.user.role}`
    );

    const attackerToken = regEscalation.data.token;
    const attackerAuditAttempt = await request('/audit', {
      headers: { Authorization: `Bearer ${attackerToken}` },
    });
    assert(
      attackerAuditAttempt.status === 403,
      'Newly registered user cannot access reviewer/admin endpoints (403 Forbidden)',
      'Privilege Escalation'
    );

    // 4.2 Non-admin (Reviewer) attempts to update a user role
    const reviewerRoleUpdate = await request(`/users/${regEscalation.data.user.id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${reviewerToken}` },
      body: JSON.stringify({ role: 'admin' }),
    });
    assert(
      reviewerRoleUpdate.status === 403,
      'Reviewer attempting PATCH /api/users/:id/role rejected with 403 Forbidden',
      'Privilege Escalation'
    );

    // 4.3 Legitimate Admin can manage user roles
    const adminRoleUpdate = await request(`/users/${regEscalation.data.user.id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'reviewer' }),
    });
    assert(
      adminRoleUpdate.status === 200 && adminRoleUpdate.data.user.role === 'reviewer',
      'Authorized Admin can promote a user to reviewer role',
      'Privilege Escalation'
    );

    // -------------------------------------------------------------
    // CATEGORY 5: DRAFT DISCLOSURE PROTECTION
    // -------------------------------------------------------------
    console.log('\n-- Category 5: Draft Disclosure Protection --');

    // Create a draft scheme using reviewer session
    const draftCreate = await request('/schemes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reviewerToken}` },
      body: JSON.stringify({
        title: 'Secret Internal Draft Welfare Scheme',
        sector: 'Healthcare',
        level: 'Central',
        status: 'draft',
        shortDescription: 'Unapproved internal government welfare proposal.',
      }),
    });
    assert(
      draftCreate.status === 201 && Boolean(draftCreate.data.scheme.id),
      'Reviewer successfully created new draft scheme',
      'Draft Disclosure'
    );
    const draftId = draftCreate.data.scheme.id;

    // 5.1 Unauthenticated attempt to fetch draft scheme directly
    const unauthDraftGet = await request(`/schemes/${draftId}`);
    assert(
      unauthDraftGet.status === 403,
      'Unauthenticated request to draft scheme /schemes/:id rejected with 403 Forbidden',
      'Draft Disclosure'
    );

    // 5.2 Citizen attempt to fetch draft scheme directly
    const citizenDraftGet = await request(`/schemes/${draftId}`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(
      citizenDraftGet.status === 403,
      'Citizen request to draft scheme /schemes/:id rejected with 403 Forbidden',
      'Draft Disclosure'
    );

    // 5.3 Citizen attempt to chat with draft scheme assistant
    const citizenDraftChat = await request(`/schemes/${draftId}/chat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What are the benefits of this draft scheme?' }],
      }),
    });
    assert(
      citizenDraftChat.status === 403,
      'Citizen request to chat with unapproved draft scheme rejected with 403 Forbidden',
      'Draft Disclosure'
    );

    // 5.4 Citizen attempt to request explanation for draft scheme
    const citizenDraftExplain = await request('/eligibility/explain', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({
        schemeId: draftId,
        profile: { state: 'Uttar Pradesh' },
        evaluation: { status: 'eligible' },
      }),
    });
    assert(
      citizenDraftExplain.status === 403,
      'Citizen request to explain unapproved draft scheme rejected with 403 Forbidden',
      'Draft Disclosure'
    );

    // 5.5 Reviewer can access draft scheme
    const reviewerDraftGet = await request(`/schemes/${draftId}`, {
      headers: { Authorization: `Bearer ${reviewerToken}` },
    });
    assert(
      reviewerDraftGet.status === 200 && reviewerDraftGet.data.scheme.id === draftId,
      'Authorized Reviewer can access draft scheme for verification',
      'Draft Disclosure'
    );

    // -------------------------------------------------------------
    // CATEGORY 6: DESTRUCTIVE OPERATIONS GUARD
    // -------------------------------------------------------------
    console.log('\n-- Category 6: Destructive Operations Guard --');

    // 6.1 Citizen cannot reset DB
    const citizenReset = await request('/admin/reset-db', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(
      citizenReset.status === 403,
      'Citizen calling POST /api/admin/reset-db rejected with 403 Forbidden',
      'Destructive Guard'
    );

    // 6.2 Reviewer cannot reset DB
    const reviewerReset = await request('/admin/reset-db', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reviewerToken}` },
    });
    assert(
      reviewerReset.status === 403,
      'Reviewer calling POST /api/admin/reset-db rejected with 403 Forbidden',
      'Destructive Guard'
    );

    // 6.3 Admin CAN reset DB
    const adminReset = await request('/admin/reset-db', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminReset.status === 200,
      'Admin calling POST /api/admin/reset-db succeeds with 200 OK',
      'Destructive Guard'
    );

    // Summary calculation
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log('\n===============================================================');
    console.log(`  TEST RESULTS SUMMARY: ${passed}/${total} PASSED (${failed} FAILED)  `);
    console.log('===============================================================\n');

    if (failed > 0) {
      console.error(`Failed tests:`);
      results.filter((r) => !r.passed).forEach((r) => console.error(` - [${r.category}] ${r.name}: ${r.details}`));
      process.exit(1);
    } else {
      console.log('All RBAC security assertions PASSED successfully!\n');
    }
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
