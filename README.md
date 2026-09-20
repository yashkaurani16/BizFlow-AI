# BizFlow AI — AI-Powered Business Automation Platform

**Version:** MVP v1.0 (Production Hardened & Release Ready)  
**Status:** Complete (Milestones 1–24 Verified)

BizFlow AI is a centralized business automation workspace for freelancers, startups, and small teams. It unifies CRM lead management, bounded AI agent configurations, automated and visual workflow execution, multi-channel external communications (Email, WhatsApp, SMS) with mandatory human review, operational analytics with AI strategic insights, and enterprise-grade security hardening.

---

## Table of Contents
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Local Setup & Quickstart](#local-setup--quickstart)
- [Environment Variables](#environment-variables)
- [Development & Testing Commands](#development--testing-commands)
- [Visual Workflow Builder](#visual-workflow-builder)
- [AI Intelligence & Google Gemini Integration](#ai-intelligence--google-gemini-integration)
- [External Communications & Development Sandbox](#external-communications--development-sandbox)
- [Advanced Analytics & AI Strategic Insights](#advanced-analytics--ai-strategic-insights)
- [Security & Production Hardening](#security--production-hardening)
- [Production Deployment Guide](#production-deployment-guide)
- [Documentation & AI Context Files](#documentation--ai-context-files)

---

## Key Features

1. **Complete CRM & Lead Pipeline**:
   - Capture, search, filter, and track leads through 5 lifecycle stages: `New`, `Contacted`, `Qualified`, `Converted`, `Lost`.
   - Comprehensive audit trail recording all lead activities, notes, and task assignments.

2. **Google Gemini AI Lead Intelligence**:
   - Automated lead scoring (0–100), prioritization (`Low`, `Medium`, `High`), key signals extraction, risk analysis, recommended next actions, and tailored outreach drafts.
   - Deterministic bounded fallback ensures zero user disruption if Gemini API is unavailable or unconfigured.

3. **Visual Workflow Builder**:
   - Interactive drag-and-drop workflow canvas supporting custom graph construction.
   - 9 allowlisted bounded node types across Triggers, AI processing, CRM operations, and Communications.
   - Real-time graph validation catching orphans, cycles, missing triggers, or unapproved communication configurations.

4. **External Communications Hub**:
   - Multi-channel support for **Email**, **WhatsApp**, and **SMS**.
   - **Mandatory Human Review**: Zero autonomous message dispatch; explicit human review and approval required for every send.
   - **Development Sandbox Mode**: Safe default simulating delivery receipts without connecting to paid carrier networks or leaking secrets.

5. **Operational Analytics & AI Strategic Insights**:
   - Real data-driven KPI metrics (Conversion rates, qualification velocity, average AI scores).
   - Pipeline funnel analysis, score distribution tiers, channel audit breakdowns, and calendar time-series charts.
   - Read-only AI strategic insights highlighting actionable revenue recommendations.

6. **Production-Grade Security**:
   - Strict multi-tenant isolation on every database query (`owner: req.user._id`).
   - Route-level MongoDB ObjectId validation preventing malformed parameter errors.
   - Input sanitization defending against NoSQL query operator injection (`$` and `.`).
   - Sliding-window in-memory rate limiting on sensitive API endpoints.
   - Defense-in-depth HTTP security headers (`nosniff`, `DENY`, `HSTS`, `CSP`).
   - Centralized error handler preventing stack trace, schema, and filesystem leakage.

---

## System Architecture

```
                                  [ Users & Clients ]
                                           │
                                  (HTTPS / JWT Bearer)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND: React 19 SPA (Vercel)                                 │
│  - 12 Responsive Screens (Dashboard, Leads, Workflows, Visual Builder, Analytics, etc.) │
│  - Centralized API Service with automatic token injection & network fallback           │
│  - Toast notifications, modal workflows, accessible color tokens & glassmorphism       │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                  (REST API / CORS Guard)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     BACKEND: Node.js + Express API (Render)                            │
│  ├── Security Middleware: Helmet-style Headers, NoSQL Sanitizer, Rate Limiters         │
│  ├── Multi-Tenant Controller Layer: Verified user ownership on all CRUD operations     │
│  ├── AI Service Layer: Google Gemini 2.5 Flash with deterministic fallback             │
│  ├── Communication Service: Provider-agnostic Email, WhatsApp, and SMS Sandbox        │
│  └── Workflow Engine: Fixed New Lead Follow-Up + Dynamic Visual Graph Executor         │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                  (Mongoose Driver)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE: MongoDB (Atlas / Local)                               │
│  - Collections: Users, Leads, Agents, Workflows, Executions, Activities, Tasks         │
│  - In-Memory Dev Store: Zero-dependency local development fallback                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, React Router 7 | Responsive SPA, Vanilla CSS tokens, Zero UI framework bloat |
| **Backend** | Node.js (ES Modules), Express 4 | RESTful architecture, modular service layer, custom middleware |
| **Database** | MongoDB 6+, Mongoose 8 | Document schemas with strict indexation & tenant validation |
| **AI Integration** | Google Gemini (`@google/genai`) | Gemini 2.5 Flash model with server-side secret isolation |
| **Security** | In-memory limiter, Sanitizers, Headers | Defense-in-depth without bloated third-party dependencies |
| **Deployment Targets** | Vercel (Frontend), Render (Backend) | Turnkey SPA rewrites and Infrastructure-as-Code blueprints |

---

## Local Setup & Quickstart

### 1. Prerequisites
- Node.js v18.0.0+ (v20+ recommended)
- npm v9.0.0+
- Git

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
The API starts at `http://localhost:5000/api`. Verify health: `http://localhost:5000/api/health`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
The frontend starts at `http://localhost:5176` (or `http://localhost:5173`).

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bizflow_ai
CLIENT_URL=http://localhost:5176,http://localhost:5173
JWT_SECRET=bizflow_ai_development_jwt_secret_key_2026
NODE_ENV=development

# AI Provider Configuration (Server-side only)
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
AI_API_KEY=your_gemini_api_key_here

# External Communication Providers (Sandbox defaults)
EMAIL_PROVIDER=sandbox
WHATSAPP_PROVIDER=sandbox
SMS_PROVIDER=sandbox
```

### Frontend (`frontend/.env.local`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Development & Testing Commands

### Backend Tests
```powershell
# Run all automated tests (147+ tests across Steps 18–24)
cd backend
npm.cmd run test:all

# Run individual milestone suites
npm.cmd run test:step24     # Release & deployment tests
npm.cmd run test:step23     # Security & production hardening tests
npm.cmd run test:step22     # Analytics & AI insights tests
npm.cmd run test:step21     # Visual workflow builder tests
npm.cmd run test:step20     # External communications sandbox tests
npm.cmd run test:step19     # CRM lead intelligence tests
npm.cmd run test:regression # Baseline regression tests
node tests/geminiStep18.test.js
node tests/verifyGeminiConnection.js
```

### Frontend Linting & Production Build
```powershell
cd ../frontend
npm.cmd run lint    # Oxlint — 0 errors
npm.cmd run build   # Vite production bundle in dist/
```

---

## Visual Workflow Builder

The Visual Workflow Builder (`frontend/src/components/workflow-builder/WorkflowBuilder.jsx`) enables users to construct automated pipelines visually:
- **Node Catalog (9 Bounded Types)**:
  - *Triggers*: New Lead Created (`trigger_new_lead`), Lead Status Changed (`trigger_status_change`)
  - *AI Actions*: Analyze Lead (`ai_analyze_lead`), Score Lead (`ai_score_lead`), Generate Outreach Draft (`ai_generate_draft`)
  - *CRM Actions*: Create Follow-Up Task (`crm_create_task`), Update Lead Status (`crm_update_status`), Log Activity (`crm_log_activity`)
  - *Communication Actions*: Send Email (`comm_send_email`), Send WhatsApp (`comm_send_whatsapp`), Send SMS (`comm_send_sms`)
- **Graph Validation Engine**: Rejects orphan nodes, missing triggers, incoming trigger edges, self-loops, and communication nodes lacking explicit human review requirements.

---

## AI Intelligence & Google Gemini Integration

- **Provider**: Google Gemini 2.5 Flash accessed via official `@google/genai` SDK.
- **Data Boundary**: AI analysis operates strictly on data provided in the CRM lead record. No external network scraping or unauthorized data harvesting.
- **Safety Policy**: All AI recommendations require human approval before operational dispatch.
- **Bounded Fallback**: If the Gemini API key is missing or invalid, the backend automatically transitions to deterministic heuristics. User workflows never fail due to AI downtime.

---

## External Communications & Development Sandbox

- **Channel Adapters**: Provider-agnostic architecture supporting Email, WhatsApp, and SMS.
- **Human Approval Mandate**: The API strictly enforces `humanApproved === true`. Requests with unapproved flags are rejected with HTTP 400.
- **Sandbox Simulation**: In sandbox mode, dispatch operations generate realistic delivery receipts (`simulated: true`, `mode: 'sandbox'`) and audit them in the lead activity log without hitting external carrier APIs.

---

## Advanced Analytics & AI Strategic Insights

- **Operational CRM Metrics**: Real counts for Total, New, Contacted, Qualified, Converted, and Lost leads.
- **Funnel Analytics**: Real pipeline conversion rates and qualification velocity.
- **AI Score Distribution**: Real tiers (`0–39`, `40–69`, `70–89`, `90–100`).
- **Communication Auditing**: Total drafts, human approvals, and sandbox dispatches broken down by channel.
- **AI Strategic Insights**: Read-only recommendations that analyze pipeline bottlenecks and conversion momentum.

---

## Security & Production Hardening

- **Multi-Tenant Isolation**: Every query checks `owner: req.user._id`. Cross-user access returns HTTP 404.
- **Input Sanitization**: Rejects NoSQL query operator injection (`$` and `.`) with HTTP 400.
- **ObjectId Validation**: Parameters (`:id`) validated as 24-hexadecimal strings before query execution.
- **Rate Limiting**: Sliding-window limiter on sensitive auth, AI, workflow, and communication routes.
- **Security Headers**: Standard defense-in-depth headers applied; `X-Powered-By` disabled.
- **Error Sanitization**: Never leaks stack traces, database schema details, or server paths.
- **Zero Secrets**: Credentials remain server-side only; `backend/.env` is strictly git-ignored.

---

## Production Deployment Guide

### Vercel Deployment (Frontend SPA)
1. Push your repository to GitHub.
2. Log into [Vercel](https://vercel.com) and import the repository.
3. Configure the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://<your-backend-render-url>/api`
5. Click **Deploy**. Vercel will automatically apply SPA routing rewrites via [`frontend/vercel.json`](frontend/vercel.json).

### Render Deployment (Backend Web Service)
1. Log into [Render](https://render.com) and create a **Web Service** from GitHub (or use the Blueprint in [`render.yaml`](render.yaml)).
2. Configure settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. Configure Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: Your MongoDB Atlas URI (`mongodb+srv://...`)
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://bizflow-ai.vercel.app`)
   - `JWT_SECRET`: A secure 64-character random string
   - `AI_PROVIDER`: `gemini`
   - `AI_MODEL`: `gemini-2.5-flash`
   - `AI_API_KEY`: Your Google Gemini API Key
   - `EMAIL_PROVIDER`: `sandbox`
   - `WHATSAPP_PROVIDER`: `sandbox`
   - `SMS_PROVIDER`: `sandbox`
4. Click **Create Web Service**. Verify health check at `https://<your-service>.onrender.com/api/health`.

---

## Documentation & AI Context Files

- [`PRD.md`](PRD.md) — Product Requirements Document (MVP specification)
- [`AGENTS.md`](AGENTS.md) — Complete operational guide and safety policies for AI agents
- [`AI-CONTEXT.md`](AI-CONTEXT.md) — Rapid reference cheat sheet for AI assistants
- [`docs/DEVELOPMENT-GUIDE.md`](docs/DEVELOPMENT-GUIDE.md) — Engineering and deployment manual
- [`docs/architecture.md`](docs/architecture.md) — Architectural system diagrams and specifications
- [`docs/UI-UX-PLAN.md`](docs/UI-UX-PLAN.md) — 12-screen UI/UX design specifications

---

## License
Private project. All rights reserved.
