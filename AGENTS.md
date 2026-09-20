# AGENTS.md — BizFlow AI Operating Guide for AI Agents

This document defines the architecture, design patterns, safety policies, data models, API contracts, and operational constraints for AI agents and coding assistants working within the **BizFlow AI** codebase.

---

## 1. Project Purpose & Scope

**BizFlow AI** is a centralized business automation workspace for freelancers, startups, and small businesses. It consolidates CRM lead management, bounded AI agents (Sales, Customer Support, Marketing), automated workflow execution, visual workflow design, operational analytics with AI strategic insights, and multi-channel external communications (Email, WhatsApp, SMS) with mandatory human review.

- **Current Milestone**: STEP 24 (Final Release & Production Hardening).
- **Core Principle**: Strict multi-tenant data isolation, zero autonomous external actions, and robust defense-in-depth security.

---

## 2. Architecture & Technology Stack

| Layer | Technology | Primary Directory | Deployment Target |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 19, Vite, React Router 7 | `frontend/` | Vercel |
| **Backend** | Node.js (ES Modules), Express 4 | `backend/src/` | Render |
| **Database** | MongoDB 6+ with Mongoose 8 | `backend/src/models/` | MongoDB Atlas / Local |
| **AI Engine** | Google Gemini (`@google/genai`) | `backend/src/services/ai/` | Server-side only |
| **Styling** | Vanilla CSS Design System | `frontend/src/styles/` | Bundled via Vite |

### System Data Flow
```
User / Browser (React SPA on Vercel)
         │  (HTTPS / JWT Bearer)
         ▼
Express API on Render (Security Headers, Rate Limiter, NoSQL Sanitizer)
         ├── Auth & Ownership Guard (req.user._id)
         ├── CRM & Workflow Engine (Multi-Tenant Isolation)
         ├── Google Gemini AI Service (Server-side API key + Fallback)
         ├── Communication Layer (Email, WhatsApp, SMS Sandbox)
         └── MongoDB / Mongoose Data Layer (Atlas or Dev Fallback)
```

---

## 3. Codebase Structure

```
BizFlow-AI/
├── AGENTS.md                        # This operational guide for AI agents
├── AI-CONTEXT.md                    # Rapid AI context cheat sheet
├── PRD.md                           # Product Requirements Document
├── README.md                        # User-facing and developer documentation
├── render.yaml                      # Render deployment blueprint
├── docs/
│   ├── DEVELOPMENT-GUIDE.md         # Comprehensive engineering & deployment guide
│   ├── UI-UX-PLAN.md                # 12-screen design specifications
│   └── architecture.md              # System architectural reference
├── frontend/
│   ├── vercel.json                  # Vercel SPA routing rewrite rules
│   ├── .env.example                 # Frontend environment template
│   ├── vite.config.js               # Vite configuration
│   └── src/
│       ├── components/              # Shared UI components & workflow-builder
│       │   └── workflow-builder/    # Canvas, NodePalette, NodeProperties, etc.
│       ├── context/                 # Auth, Leads, Agents, Workflows, Toast contexts
│       ├── pages/                   # 12 core application pages
│       ├── services/api.js          # Central API client (auto JWT attach)
│       └── styles/                  # Design system tokens, layouts, modules
└── backend/
    ├── package.json                 # Scripts: start, dev, test, test:all, test:step*
    ├── .env.example                 # Backend environment template
    ├── src/
    │   ├── app.js                   # Express app setup, CORS, middleware mounts
    │   ├── server.js                # Port binding & MongoDB initialization
    │   ├── config/database.js       # Resilient Mongoose connection handler
    │   ├── middleware/              # Auth, error, rateLimit, sanitization, headers
    │   ├── models/                  # Mongoose schemas (User, Lead, Agent, Workflow, etc.)
    │   ├── routes/                  # Express routers (auth, leads, workflows, etc.)
    │   ├── controllers/             # Business logic & tenant isolation checks
    │   ├── services/
    │   │   ├── ai/                  # Gemini provider adapter, prompts, fallbacks
    │   │   ├── communications/      # Email, WhatsApp, SMS sandbox adapters
    │   │   └── workflowEngine.js    # Legacy & visual workflow graph executors
    │   └── utils/devStore.js        # Offline in-memory fallback for development
    └── tests/                       # 8 automated integration test suites
```

---

## 4. Database Models & Schema Boundaries

All operational collections enforce multi-tenant isolation through the `owner` field referencing `User._id`:

1. **`User`** (`backend/src/models/User.js`):
   - Fields: `name`, `email`, `passwordHash`, `businessName`, `role`, `createdAt`.
   - **Safety Rule**: `passwordHash` must NEVER be returned in API responses.

2. **`Lead`** (`backend/src/models/Lead.js`):
   - Fields: `owner`, `name`, `email`, `phone`, `company`, `status` (`New`, `Contacted`, `Qualified`, `Converted`, `Lost`), `source`, `notes`, `aiScore` (0–100), `aiPriority` (`Low`, `Medium`, `High`), `aiAnalysis`, `aiIntelligence` (signals, risks, recommendedAction, outreachDrafts), `humanReviewRequired` (permanently `true`).

3. **`Agent`** (`backend/src/models/Agent.js`):
   - Fields: `owner`, `name`, `type` (`sales`, `support`, `marketing`), `systemPrompt`, `isActive`, `config`.

4. **`Workflow`** (`backend/src/models/Workflow.js`):
   - Fields: `owner`, `name`, `description`, `trigger`, `isActive`, `nodes` (Visual node array), `edges` (Connection array), `runCount`, `lastRunAt`.

5. **`WorkflowExecution`** (`backend/src/models/WorkflowExecution.js`):
   - Fields: `workflow`, `lead`, `owner`, `trigger`, `status` (`Pending`, `Running`, `Succeeded`, `Failed`, `Waiting for Human Review`), `stepResults`, `error`, `completedAt`.

6. **`Activity`** (`backend/src/models/Activity.js`):
   - Fields: `owner`, `type`, `title`, `description`, `lead`, `metadata`.

7. **`FollowUpTask`** (`backend/src/models/FollowUpTask.js`):
   - Fields: `owner`, `lead`, `title`, `description`, `dueDate`, `isCompleted`.

---

## 5. Critical AI Safety & Communication Invariants

1. **Mandatory Human Review**:
   - Every AI-generated output (scoring, analysis, follow-up recommendations, outreach drafts) must be flagged with `humanReviewRequired: true`.
   - **Zero Autonomous Dispatch**: The backend MUST reject any attempt to send external messages where `humanApproved !== true` with HTTP 400.

2. **Development Sandbox Guarantee**:
   - Default external communication adapters (`email`, `whatsapp`, `sms`) operate strictly in **Development Sandbox Mode**.
   - Sandbox dispatches return simulated delivery receipts (`simulated: true`, `mode: 'sandbox'`) and audit them in `Activity` logs without transmitting external network packets.
   - Real provider SDKs or production credentials must never be assumed or fabricated.

3. **AI Bounded Fallback**:
   - If the Google Gemini API key is missing, invalid, or rate-limited, the system must seamlessly fall back to deterministic, bounded heuristic analysis (`aiFallback.js`).
   - The user workflow or lead creation must NEVER fail due to AI provider unavailability.

---

## 6. Visual Workflow Builder Rules

1. **Allowlisted Node Types** (Strict Catalog of 9 Bounded Nodes):
   - **Triggers**: `trigger_new_lead`, `trigger_status_change`
   - **AI Actions**: `ai_analyze_lead`, `ai_score_lead`, `ai_generate_draft`
   - **CRM Actions**: `crm_create_task`, `crm_update_status`, `crm_log_activity`
   - **Communication Actions**: `comm_send_email`, `comm_send_whatsapp`, `comm_send_sms`

2. **Graph Validation Invariants** (`workflowValidator.js`):
   - Exactly **one** starting trigger node.
   - Zero incoming edges to the starting trigger.
   - No disconnected / orphan nodes (all nodes must be reachable from trigger).
   - No self-looping edges (`source !== target`).
   - All communication nodes MUST have `humanApprovalRequired: true` in configuration.

---

## 7. Security Hardening & Defenses

1. **Authentication & Authorization**:
   - Private routes require `Authorization: Bearer <token>`.
   - Every controller verifies ownership (`owner: req.user._id`). Unowned resources return HTTP 404 (preventing ID enumeration).

2. **Input Validation & Sanitization**:
   - **ObjectId Validation**: `validateObjectId('id')` middleware returns clean HTTP 400 for non-hex IDs before Mongoose executes queries.
   - **NoSQL Operator Injection Protection**: `sanitizeNoSql` middleware blocks keys beginning with `$` or containing `.` with HTTP 400.
   - **Payload Limiting**: Requests capped at 1MB (`express.json({ limit: '1mb' })`).

3. **HTTP Response Hardening**:
   - Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy`.
   - Framework disclosure disabled: `app.disable('x-powered-by')`.
   - CORS restricted to allowed origins parsed from `CLIENT_URL` (supports comma-separated origins for preview & production domains).

4. **Rate Limiting**:
   - Sliding-window in-memory rate limiter on `/api/auth`, `/api/ai`, `/api/communications`, and `/api/workflows`.

5. **Error Sanitization**:
   - Central error handler (`errorMiddleware.js`) intercepts errors and never leaks stack traces, source file paths, or internal schema details to API consumers.

---

## 8. Verification & Testing Commands

Always use PowerShell-compatible commands on Windows:

```powershell
# Run complete test suite (147+ tests across Steps 18–24)
cd backend
npm.cmd run test:all

# Run individual milestone test suites
npm.cmd run test:step24   # Release & deployment tests
npm.cmd run test:step23   # Security hardening tests
npm.cmd run test:step22   # Analytics & AI insights tests
npm.cmd run test:step21   # Visual workflow builder tests
npm.cmd run test:step20   # Communications sandbox tests
npm.cmd run test:step19   # CRM lead intelligence tests
npm.cmd run test:regression # Step 18 baseline regression
node tests/geminiStep18.test.js
node tests/verifyGeminiConnection.js

# Frontend Linting & Production Build
cd ../frontend
npm.cmd run lint          # 0 errors
npm.cmd run build         # Vite production bundle
```

---

## 9. Critical "Do-Not-Break" Rules for Future Agents

1. **DO NOT** commit real secrets, API keys, JWT secrets, or connection strings. Keep `backend/.env` strictly ignored.
2. **DO NOT** remove the human review requirement or sandbox simulation from communication services.
3. **DO NOT** remove the offline `devStore.js` fallback; it ensures development and tests run smoothly without local MongoDB dependencies.
4. **DO NOT** replace or break the fixed 5-step `New Lead Follow-Up` workflow.
5. **DO NOT** allow arbitrary code execution or unvalidated node types in the Visual Workflow Builder.
6. **DO NOT** expose stack traces or internal implementation paths in API error responses.
