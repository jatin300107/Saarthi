# SAARTHI — AI-Assisted Government Scheme Knowledge Platform

SAARTHI is a production-grade civic intelligence platform designed for Indian citizens to discover government schemes and verify eligibility deterministically, while empowering administrators and verification officers with AI document ingestion, OCR extraction, human-in-the-loop review, and tamper-evident audit trails.

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural directions below incorporate your confirmed preferences from Phase 1. Review the key decisions and system blueprint before execution.

- **Confirmed Decision 1 (Domain Scope)**: Pre-loaded scheme corpus and ingestion templates prioritize a diverse cross-sector mix spanning **Agriculture** (PM-KISAN, PMFBY), **Education & Skilling** (PM Vidya Lakshmi, National Merit Scholarship), **Healthcare & Social Welfare** (Ayushman Bharat PM-JAY, PM Matru Vandana), and **MSME & Entrepreneurship** (PMEGP, Mudra Yojana).
- **Confirmed Decision 2 (Persistence & Security Architecture)**: Full-stack Node.js/Express backend with server-authoritative file-backed JSON/SQLite storage, atomic state mutations, role-based access control (RBAC), and persistent audit logging for every ingestion, edit, version change, and approval.
- **Confirmed Decision 3 (Citizen Discovery Experience)**: Interactive multi-step citizen profile wizard paired with a deterministic server-side rule evaluation engine (`Eligible`, `Ineligible`, `Insufficient Information`) and Gemini 2.5 Flash plain-language rule explanations with document checklists.

---

## 1. Overview & Core Concept

- **What It Does**: SAARTHI bridges the gap between complex government gazette notifications and citizens who need actionable welfare support. Citizens complete a 2-minute profile (state, demographic category, age, income bracket, land ownership, student/occupation status) and receive instant, deterministic eligibility determinations with transparent rule explanations and exact document preparation checklists. Administrators upload scheme notifications (PDFs/scanned circulars), inspect page-numbered OCR/text extractions, edit structured rules and benefits, and approve or reject versions with full audit accountability.
- **Target Audience / Persona**:
  - *Indian Citizens & CSC (Common Service Center) VLE Operators*: Seeking welfare schemes matching specific family, student, or farming criteria without legalistic confusion.
  - *Scheme Reviewers & Verification Officers*: Public service administrators responsible for validating scheme guidelines, benefits, and eligibility criteria against official gazettes before public listing.
  - *Auditors & Policy Analysts*: Inspecting version histories, source citations, and human modification logs.
- **Key Value**: Replaces hallucination-prone generic search with server-authoritative, deterministic rule evaluations, guaranteed source citations, and human-in-the-loop verification where unapproved drafts are never presented as official schemes.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Citizen Scheme Discovery & Interactive Profile Wizard**:
   - Zero State: Clean national civic landing interface featuring quick-search, sector badges (Agriculture, Education, Healthcare, MSME), and high-impact scheme highlights.
   - Interactive Profile Flow: Citizens specify State/UT, Age, Gender, Category (General, OBC, SC, ST, EWS), Annual Household Income, Occupation/Student status, and specific flags (e.g. Landholding < 2 hectares, BPL cardholder, Divyangjan status).
   - Instant Evaluation: Server executes deterministic rule matching across active approved schemes, categorizing results into *Eligible*, *Potentially Eligible (Missing Info)*, and *Ineligible* with explicit failure/success reasons, document preparation checklists, and official portal links.
   - Plain-Language AI Explanation: Citizens can request an easy-to-understand breakdown of why the rules apply to their profile in simple terms, referencing official clauses without changing rule outcomes.

2. **Scheme Detail & Source Grounding**:
   - Comprehensive scheme breakdown: Objective, financial/in-kind benefits, eligibility conditions, required documents, step-by-step application process, nodal ministry/department, and official application URL.
   - Citation & Evidence Drawer: Citizens and reviewers can inspect the approved document version, page references, and gazette date.

3. **Admin & Officer Verification Console**:
   - Role Selection & Authenticated Session: Secure role switcher / credentials for Reviewer, Department Admin, and Citizen modes.
   - Document Ingestion: PDF/scanned document uploader with file validation, page preservation, and server-side text + OCR extraction using Gemini multimodal analysis.
   - Human-in-the-Loop Review Studio: Side-by-side view with extracted source text/clauses on the left and editable structured schema fields on the right. Reviewers can edit, correct rules, mark fields, approve publication, or reject with notes.
   - Audit Trail & Version History: Immutable chronological log tracking document uploads, AI extractions, manual overrides, reviewer approvals, and version increments.
   - Demo Data Management: Clearly labeled "Demo / Fictional" vs "Official Gazette" scheme records to ensure integrity during testing.

### Visual Identity & Theme

- **Aesthetic Direction**: Contemporary Indian Public-Service Civic Architecture. Inspired by modern national platforms (MyGov, Digital India, UIDAI) with high typographic clarity, restraint, and dignified authority.
- **Color Palette & Atmospheric Restraint (60-30-10 Rule)**:
  - *Neutral Canvas (60%)*: Crisp off-white and cool slate surfaces (`#F8FAFC`, `#FFFFFF`, dark mode `#0F172A`).
  - *Civic Structural Surfaces (30%)*: Deep Indian Navy Blue (`#0F284E`, `#1E3A8A`) for headers, navigation, and structural dividers; refined slate borders (`border-slate-200 dark:border-slate-800`).
  - *National Civic Accents (10%)*: Saffron-amber accent (`#D97706`, `#B45309`) strictly reserved for active status highlights, key callouts, and primary actions; civic emerald (`#059669`) for verified approvals and eligible status; crimson (`#DC2626`) for ineligibility warnings.
- **Typography & Hierarchy**:
  - *Display / Hero / Navigation*: `Plus Jakarta Sans` with balanced weights (Regular 400, SemiBold 600, Bold 700).
  - *Body Prose & Form Fields*: `Public Sans` / `DM Sans` for high legibility at 13px–16px across dense eligibility tables and guidelines.
  - *Data, Citations & Timestamps*: `tabular-nums font-mono` (`IBM Plex Mono`) for gazette numbers, dates, monetary benefits (₹), and audit hashes.
- **Anti-Slop Discipline**:
  - Zero pill enclosures for static metadata; tags and dates styled with clean unboxed text and `·` separators.
  - No decorative pulsing dots, no fake compiler status logs, no arbitrary 92/100 innovation scoreboards.
  - Top Bar follows the strict 3-zone contract: Brand wordmark, 4 single-line navigation links, and 1 primary citizen/admin portal switch action.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Authoritative Deterministic Rule Engine vs. Pure LLM Matching**:
  - *Chosen Approach*: Hard criteria (age, income cap, state residency, land limits, education level, gender/category quotas) are evaluated deterministically in TypeScript on the server. Gemini is utilized exclusively for extracting structured rule definitions from ingested documents and generating plain-language explanatory summaries.
  - *Why*: Public welfare allocation cannot rely on stochastic LLM judgments. A deterministic engine guarantees reproducible, legally sound eligibility evaluations and eliminates hallucinations.
  - *Alternatives Considered*: Pure prompt-based matching (rejected due to unpredictability and potential false promises to vulnerable citizens).

- **Decision 2: Express Server Middleware in Vite Dev + Standalone Production Runner**:
  - *Chosen Approach*: Full-stack Node.js/Express backend unified with Vite dev server middleware during development on port 3000, and standalone `node server.ts` production build serving the client dist with persistent file-backed JSON store in `.data/`.
  - *Why*: Satisfies AI Studio single-port requirements (port 3000) while keeping all Gemini API keys strictly server-side, enabling authentic file uploads, persistence, and RBAC authentication headers.
  - *Alternatives Considered*: Client-only mock state with localStorage (rejected because the brief explicitly mandates real full-stack backend persistence, role authorization, and server-side Gemini calls).

- **Decision 3: Gemini 2.5 Flash for Multimodal PDF/OCR Ingestion & JSON Schema Enforcement**:
  - *Chosen Approach*: Server sends base64 PDF buffers to `gemini-3.8-flash` with `responseMimeType: "application/json"` and strict schema typing. It captures page markers, confidence indicators, and field-level evidence. If extraction fails or document is unreadable, a clear error is returned rather than faking success.
  - *Why*: Eliminates fragile external OCR binary dependencies while providing top-tier Indian multi-page document parsing in a single hermetic call.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SAARTHI Client (React 19 + TS)                  │
│                                                                        │
│   ┌─────────────────────┐  ┌────────────────────┐  ┌───────────────┐   │
│   │ Citizen Viewport    │  │ Scheme Directory   │  │ Admin Review  │   │
│   │ • Search & Filters  │  │ • Detailed Spec    │  │ • PDF Ingest  │   │
│   │ • Profile Wizard    │  │ • Document Guide   │  │ • Field Diff  │   │
│   │ • Match Results     │  │ • Source Evidence  │  │ • Audit Log   │   │
│   └──────────┬──────────┘  └─────────┬──────────┘  └───────┬───────┘   │
│              │                       │                     │           │
│              └───────────────────────┼─────────────────────┘           │
│                                      │                                 │
│                                HTTP /api/*                             │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼─────────────────────────────────┐
│                    Node.js / Express Server (server.ts)                │
│                                                                        │
│   ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────┐   │
│   │ Auth & RBAC Guard │  │ Eligibility Engine│  │ Ingestion Engine │   │
│   │ • Citizen/Admin   │  │ • Deterministic   │  │ • PDF Buffer     │   │
│   │ • Token/Session   │  │ • 3-Tier Match    │  │ • Gemini Schema  │   │
│   └─────────┬─────────┘  └─────────┬─────────┘  └────────┬─────────┘   │
│             │                      │                     │             │
│   ┌─────────▼──────────────────────▼─────────────────────▼─────────┐   │
│   │                 Storage & Audit Service (.data/)               │   │
│   │ • schemes.json (Active & Drafts)    • versions.json            │   │
│   │ • audit_log.json                    • documents/               │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │                                   │
│                        Server-Side Gemini API                          │
│                                    │                                   │
│   ┌────────────────────────────────▼───────────────────────────────┐   │
│   │ @google/genai SDK (gemini-3.8-flash)                          │   │
│   │ • Multimodal PDF extraction with structured JSON schema       │   │
│   │ • Plain-language citizen eligibility explanation               │   │
│   └───────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Entities

1. **Scheme**:
   - `id`: string (UUID)
   - `code`: string (e.g. `PM-KISAN`, `AYUSH-01`)
   - `title`: string
   - `shortDescription`: string
   - `sector`: `'Agriculture' | 'Education' | 'Healthcare' | 'MSME' | 'Social Welfare'`
   - `level`: `'Central' | 'State'`
   - `state`: string (or `'All India'`)
   - `ministry`: string
   - `benefits`: string[] (financial, insurance, subsidy, equipment)
   - `rules`: Criterion[] (field, operator, value, description, mandatory)
   - `exclusions`: string[]
   - `requiredDocuments`: { name: string; description: string; mandatory: boolean }[]
   - `applicationSteps`: string[]
   - `officialUrl`: string
   - `status`: `'draft' | 'under_review' | 'approved' | 'rejected'`
   - `isDemo`: boolean (clearly labeled)
   - `version`: number
   - `sourceDocumentId`?: string
   - `updatedAt`: string

2. **IngestedDocument**:
   - `id`: string
   - `filename`: string
   - `uploadedAt`: string
   - `uploadedBy`: string
   - `fileSize`: number
   - `pageCount`: number
   - `extractedRawText`: string
   - `status`: `'uploaded' | 'extracted' | 'review_pending' | 'published' | 'failed'`
   - `errorDetails`?: string

3. **AuditEvent**:
   - `id`: string
   - `timestamp`: string
   - `actor`: { name: string; role: 'citizen' | 'reviewer' | 'admin' }
   - `action`: `'SCHEME_CREATED' | 'DOCUMENT_UPLOADED' | 'AI_EXTRACTED' | 'SCHEME_MODIFIED' | 'SCHEME_APPROVED' | 'SCHEME_REJECTED' | 'ELIGIBILITY_EVALUATED'`
   - `targetId`: string
   - `summary`: string
   - `changes`?: { field: string; oldVal: unknown; newVal: unknown }[]

### Interactive Component & State Mapping

- **Citizen Profile State**: Real-time evaluation triggers an async query to `/api/eligibility/evaluate`. State indicators show exact passed/failed/missing rules.
- **AI Explain Drawer**: Citizen clicks "Explain in Plain Language" to invoke `/api/eligibility/explain`, receiving a clear conversational summary without overriding the deterministic score.
- **Admin Ingestion & Review Studio**:
  - File Dropzone accepts PDF files (< 10MB) with mimetype verification.
  - Progress feedback during upload, OCR text parsing, and Gemini schema extraction.
  - Interactive Diff Editor allows reviewing AI suggestions against original text, accepting or editing fields before one-click approval.
- **Role Switcher**: Persistent session role banner toggling between Citizen and Admin/Reviewer modes to test end-to-end authorization rules.
