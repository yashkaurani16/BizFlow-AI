# BizFlow AI — Comprehensive Development & Deployment Guide

This guide provides developers, maintainers, and DevOps engineers with complete instructions for developing, testing, deploying, and maintaining the **BizFlow AI** platform.

---

## 1. Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **MongoDB**: v6.0+ (Optional for local development; system includes built-in in-memory fallback)
- **Git**: For version control

### Quickstart

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yashkaurani16/BizFlow-AI.git
   cd BizFlow-AI
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   # Create local .env from template
   cp .env.example .env
   # Start backend dev server with nodemon
   npm run dev
   ```
   The backend API runs on `http://localhost:5000/api`. Verify health: `http://localhost:5000/api/health`.

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   # Start frontend Vite dev server
   npm run dev
   ```
   The frontend runs on `http://localhost:5176` (or `http://localhost:5173`).

---

## 2. System Architecture & Boundaries

```
[ Frontend: React 19 SPA ]
          │ (JWT in Authorization: Bearer Header)
          ▼
[ Express API Gateway ]
  ├─ Security Headers (nosniff, DENY, HSTS, CSP)
  ├─ CORS Origin Guard (Allowlist from CLIENT_URL)
  ├─ Rate Limiter (Auth: 30/m, AI: 60/m, Comms: 60/m, WF: 60/m)
  ├─ Payload Limit (1MB maximum)
  ├─ NoSQL Query Sanitizer (Rejects $ and . keys)
  ├─ ObjectId Validator (Rejects non-24-hex IDs)
  └─ Tenant Ownership Guard (Filters by req.user._id)
          │
  ┌───────┼──────────────────────────────┬─────────────────────────┐
  ▼       ▼                              ▼                         ▼
[ CRM ] [ Visual Workflow Engine ] [ Communications Hub ] [ AI Insights ]
  │       │                              │                         │
  ▼       ▼                              ▼                         ▼
[ MongoDB Atlas / devStore ]    [ Provider Sandbox ]    [ Gemini 2.5 Flash ]
```

---

## 3. REST API Specification

### Authentication & User Management (`/api/auth`, `/api/profile`)
- `POST /api/auth/register` — Create account (`name`, `email`, `password`, `businessName`).
- `POST /api/auth/login` — Authenticate and receive JWT token.
- `POST /api/auth/logout` — Stateless session acknowledgment.
- `GET /api/auth/me` — Return current authenticated user (passwordHash permanently omitted).
- `GET /api/profile` — Return user profile.
- `PUT /api/profile` — Update user name or business details.

### Leads & CRM (`/api/leads`)
- `GET /api/leads` — List user's leads (supports `?status=` and `?search=` filters).
- `POST /api/leads` — Create lead; automatically triggers the 5-step New Lead Follow-Up workflow.
- `GET /api/leads/:id` — Get lead details with AI analysis and audit trail.
- `PUT /api/leads/:id` — Update lead status, notes, or fields.
- `DELETE /api/leads/:id` — Delete lead and associated tasks.
- `POST /api/leads/:id/analyze` — Run on-demand AI lead intelligence analysis.

### Visual Workflows (`/api/workflows`)
- `GET /api/workflows` — List user workflows and execution metrics.
- `POST /api/workflows` — Create visual workflow graph with nodes and edges.
- `GET /api/workflows/:id` — Fetch visual workflow definition, nodes, edges, and recent execution history.
- `PUT /api/workflows/:id` — Update visual workflow graph.
- `DELETE /api/workflows/:id` — Delete workflow.
- `POST /api/workflows/validate` — Validate visual workflow graph integrity.

### External Communications (`/api/communications`)
- `GET /api/communications/status` — Get adapter health and sandbox status.
- `POST /api/communications/draft` — Generate AI communication draft across Email, WhatsApp, or SMS.
- `POST /api/communications/send` — Send communication. **Requires `humanApproved: true`**. Runs in Development Sandbox mode by default.

### Analytics & AI Insights (`/api/analytics`)
- `GET /api/analytics` — Real operational CRM and workflow metrics, pipeline funnel, AI score distribution, time series.
- `GET /api/analytics/insights` — Read-only AI strategic business insights generated from live data.

### System Diagnostics (`/api/health`)
- `GET /api/health` — Public health check returning API status and MongoDB connection status.

---

## 4. External Communication Sandbox & Human Approval

BizFlow AI enforces a strict human-in-the-loop policy for all outbound communications:

1. **AI Draft Generation**:
   - Outbound messages are generated via Gemini or bounded heuristics.
   - All drafts are labeled: `"AI Generated — Requires Human Review"`.
2. **Approval Gate**:
   - The user must review, optionally edit, and explicitly approve the draft in the UI.
   - If `humanApproved !== true`, the API rejects the dispatch request with HTTP 400.
3. **Sandbox Execution**:
   - All dispatches run through the **Development Sandbox Adapter** by default.
   - Returns a structured simulated delivery receipt (`simulated: true`, `mode: 'sandbox'`).
   - Audited directly in the lead's activity trail.

---

## 5. Visual Workflow Builder Architecture

The visual workflow builder uses a bounded graph model:
- **Node Catalog**:
  - Triggers: `trigger_new_lead`, `trigger_status_change`
  - AI Actions: `ai_analyze_lead`, `ai_score_lead`, `ai_generate_draft`
  - CRM Actions: `crm_create_task`, `crm_update_status`, `crm_log_activity`
  - Communications: `comm_send_email`, `comm_send_whatsapp`, `comm_send_sms`
- **Validation Engine** (`workflowValidator.js`):
  - Exactly one trigger node.
  - Root trigger has no incoming edges.
  - No disconnected/orphan nodes.
  - No self-loops.
  - Communication nodes enforce `humanApprovalRequired: true`.

---

## 6. Production Deployment Walkthrough

### Vercel Deployment (Frontend SPA)

1. **Import Repository**:
   - Log in to [Vercel](https://vercel.com) and click **Add New... > Project**.
   - Select the `BizFlow-AI` repository.
2. **Configure Project Settings**:
   - **Root Directory**: Select `frontend`.
   - **Framework Preset**: Vite (detected automatically).
   - **Build Command**: `npm run build` (or `vite build`).
   - **Output Directory**: `dist`.
3. **Environment Variables**:
   - Add `VITE_API_BASE_URL` with your Render backend URL (e.g. `https://bizflow-ai-backend.onrender.com/api`).
4. **Deploy**:
   - Click **Deploy**. Vercel will build the SPA and apply SPA routing rewrites via [`frontend/vercel.json`](../frontend/vercel.json).

### Render Deployment (Backend Web Service)

1. **New Web Service**:
   - Log in to [Render](https://render.com) and click **New > Web Service** (or use Blueprint with [`render.yaml`](../render.yaml)).
   - Connect the `BizFlow-AI` repository.
2. **Configure Service**:
   - **Name**: `bizflow-ai-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. **Set Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default for Render)
   - `MONGODB_URI`: Your MongoDB Atlas connection string (e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/bizflow_ai?retryWrites=true&w=majority`)
   - `CLIENT_URL`: Your Vercel domain(s) separated by commas (e.g. `https://bizflow-ai.vercel.app,https://bizflow-ai-*.vercel.app`)
   - `JWT_SECRET`: A cryptographically secure 64-character random string.
   - `AI_PROVIDER`: `gemini`
   - `AI_MODEL`: `gemini-2.5-flash`
   - `AI_API_KEY`: Your Google Gemini API Key.
   - `EMAIL_PROVIDER`: `sandbox`
   - `WHATSAPP_PROVIDER`: `sandbox`
   - `SMS_PROVIDER`: `sandbox`
4. **Deploy**:
   - Click **Create Web Service**. Verify health check at `https://bizflow-ai-backend.onrender.com/api/health`.

---

## 7. Testing & Verification

Run the full automated test suite (147+ tests):
```powershell
cd backend
npm.cmd run test:all
```

Run frontend lint and build validation:
```powershell
cd ../frontend
npm.cmd run lint   # 0 errors
npm.cmd run build  # Clean production bundle in dist/
```
