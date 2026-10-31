# SAARTHI — AI-Assisted Government Scheme Knowledge Platform

SAARTHI is a production-grade civic intelligence platform designed for Indian citizens to discover government schemes and verify eligibility deterministically, while empowering administrators and verification officers with AI document ingestion, OCR extraction, human-in-the-loop review, and tamper-evident audit trails.

---

## 🏛️ Core Workflows

1. **Citizen Welfare Discovery & Search**:
   - Filter verified central and state schemes across **Agriculture, Healthcare, Education, and MSME**.
   - Inspect clear financial assistance, exclusions, application modalities, and direct official portal links.
   - Grounded in official Gazette notifications.

2. **Deterministic Server-Side Eligibility Engine**:
   - Evaluates citizen demographic profiles (State, Age, Gender, Income, Social Category, Occupation, Landholding, BPL/Divyangjan flags).
   - Generates three clear outcomes: `Eligible`, `Needs Information`, and `Ineligible`.
   - Never hallucinates eligibility: strict TypeScript logic evaluated server-side.
   - Interactive document readiness checklist for each scheme.
   - Plain-language advisory explanations powered by Gemini 2.5 Flash without overriding legal criteria.

3. **Admin Ingestion & AI OCR Studio**:
   - Upload official circulars and PDFs (< 10MB) or paste gazette notifications.
   - Server-side Gemini 2.5 Flash extracts atomic eligibility rules, required documents, benefits, and source page citations with JSON schema validation.
   - Clear failure errors if OCR extraction fails rather than feigning success.

4. **Human-in-the-Loop Review Studio**:
   - Side-by-side verification interface: source document text with page markers on the left; editable structured fields on the right.
   - Reviewers can modify rules, adjust thresholds, and sign off with regulatory approval or rejection reasons.

5. **Tamper-Evident Version History & Audit Trail**:
   - Increments scheme versions (`v1.0`, `v2.0`) upon every verified modification.
   - Immutable audit logging for document uploads, AI extractions, parameter changes, and citizen query evaluations.

6. **Clear Separation of Demo & Official Data**:
   - Fictional testing records (e.g., Mukhyamantri Yuva Udyami Demo, Saraswati Tablet Demo) are prominently labeled `[DEMO RECORD]`.
   - Official records provide verifiable gazette IDs and ministry authorities.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express, TypeScript (`tsx`)
- **AI Engine**: `@google/genai` SDK (`gemini-3.8-flash`) executed strictly on the server
- **Persistence**: File-backed persistent JSON database (`.data/schemes.json`, `.data/documents.json`, `.data/audit_log.json`, `.data/versions.json`)

---

## ⚙️ Environment Configuration & Secrets

Configure environment variables in `.env` (or via AI Studio Secrets):

```bash
# Required for Gemini AI structured extraction and plain-language explanation
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# The hosted URL of the application (automatically injected in Cloud Run)
APP_URL="http://localhost:3000"

# Optional port setting (default 3000)
PORT=3000
```

> **Security Note:** `GEMINI_API_KEY` is accessed exclusively in server-side routes (`server/geminiService.ts`). It is never bundled into or accessible by client browser code.

---

## 🚀 Local Development & Production Run

### Development Mode (Port 3000)
```bash
npm run dev
```
Vite mounts the Express `/api` router seamlessly via dev server middleware on port 3000.

### Production Build & Standalone Full-Stack Server
```bash
npm run build
npm start
```
Starts `server.ts` via `tsx` on port 3000, serving the static frontend from `dist/` and handling all `/api` routes.

---

## 🗄️ Database Structure (`.data/`)

- `.data/schemes.json`: Active approved schemes and unapproved drafts awaiting verification.
- `.data/documents.json`: Uploaded PDF metadata, raw OCR text, and page segmentation.
- `.data/audit_log.json`: Chronological audit log with cryptographic timestamps, actor credentials, action types, and change diffs.
- `.data/versions.json`: Version snapshots tracking historical changes for every scheme.

---

## 🧪 Testing Roles & Simulation

Use the role switcher in the top navigation bar to test role-based access control:
- **Citizen Portal**: Read-only access to approved schemes; interactive profile wizard and deterministic evaluation.
- **Reviewer**: Access to Verification Studio, draft editing, and approval/rejection workflows.
- **Admin**: Full authority including database reset, document ingestion, and audit trail inspection.
