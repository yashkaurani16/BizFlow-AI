# BizFlow AI — System Architecture

**Product:** BizFlow AI — Business Automation Platform  
**Version:** MVP v1.0  
**Status:** Approved architecture (documentation only)

This document describes the MVP system architecture. It does not expand product scope beyond `PRD.md`.

---

## 1. High-level architecture

```
USER LAYER
  Freelancers, startups, small businesses, small teams
        ↓
FRONTEND
  React + Vercel
  Modules: Authentication, Dashboard, Leads/CRM, AI Agents,
           Workflows, Analytics, Profile & Settings
        ↓
BACKEND
  Node.js + Express + Render
  REST API, auth middleware, authorization/ownership,
  validation, services, AI integration layer, controllers, errors
        ↓
DATABASE
  MongoDB
  users, leads, agents, workflows, workflowExecutions,
  followUpTasks, activities
```

**Security boundary:** the backend. Frontend checks are UX only.

---

## 2. User layer

Users of the MVP:

- Freelancers
- Startups
- Small businesses
- Small teams (single-account usage in v1.0; no team management)

All application data is **user-owned**. There is no shared tenant model, invitations, or admin portal in MVP.

---

## 3. Frontend

**Stack:** React  
**Hosting:** Vercel

### 3.1 Modules

| Module | Responsibility |
| --- | --- |
| Authentication | Registration, login, logout, protected-route UX |
| Dashboard | Totals, recent activities, basic statistics |
| Leads / CRM | List, add, details/edit, status, AI analysis, next step |
| AI Agents | List, create, edit, activate, deactivate |
| Workflows | View fixed New Lead workflow and execution status |
| Analytics | Lead, agent, workflow, and basic business metrics |
| Profile & Settings | Profile, account settings, logout |

### 3.2 Frontend constraints

- No visual workflow builder.
- No direct database access.
- All mutations go through the REST API over HTTPS in production.
- Route guards hide screens; they are **not** authorization.

Screen-level UX is defined in `docs/UI-UX-PLAN.md`.

---

## 4. Backend

**Stack:** Node.js + Express  
**Hosting:** Render  
**Style:** Monolithic REST API (microservices are excluded).

### 4.1 Layers

| Layer | Role |
| --- | --- |
| REST API | HTTP JSON endpoints under `/api/*` |
| Authentication middleware | Require valid credentials/session for protected routes |
| Authorization / ownership checks | Ensure the resource belongs to the authenticated user |
| Validation | Validate and sanitize request input |
| Business logic / services | Leads, agents, workflow orchestration, aggregations |
| AI integration layer | Bounded analysis for the New Lead workflow; provider wiring deferred to API integration stage |
| Controllers / routes | Map HTTP to services |
| Error handling | Consistent errors; no stack traces to clients in production |

### 4.2 API route groups

| Prefix | Domain |
| --- | --- |
| `/api/auth` | Registration, login, logout |
| `/api/dashboard` | Dashboard aggregates |
| `/api/leads` | Lead CRUD and lead-related fields |
| `/api/agents` | Agent CRUD and activate/deactivate |
| `/api/workflows` | Fixed workflow + executions |
| `/api/analytics` | Computed metrics (no analytics collection) |
| `/api/profile` | Profile and account settings |

### 4.3 AI integration layer

- Used only for **Analyze Lead** in the fixed MVP workflow.
- Output is stored on the lead (analysis + suggested next step) so humans can review it.
- Actual AI provider integration is **deferred**; this layer is the extension point.
- Failures must not roll back lead creation.

---

## 5. Database

**Database:** MongoDB

### 5.1 Collections / entities

| Collection | Purpose |
| --- | --- |
| `users` | Account identity, hashed password, profile/settings |
| `leads` | CRM leads, status, analysis, suggested next step |
| `agents` | Sales / Customer Support / Marketing agent configs and active flag |
| `workflows` | Fixed MVP workflow definition (New Lead follow-up) |
| `workflowExecutions` | Per-run status of the New Lead workflow, including error state |
| `followUpTasks` | Tasks created after analysis (or as defined by success path) |
| `activities` | Timeline of user/system actions, including AI failure records |

**Do not** create a separate analytics collection. Analytics APIs aggregate from the collections above.

### 5.2 Ownership relationship

One **User** can own many:

- Leads
- Agents
- Workflows
- Workflow Executions
- Follow-up Tasks
- Activities

Every query that returns or mutates these entities must filter by owner (`userId` or equivalent) **on the server**.

### 5.3 Lead statuses

Stored as a closed enum:

- New
- Contacted
- Qualified
- Converted
- Lost

### 5.4 Agent types

Stored as a closed enum:

- Sales Agent
- Customer Support Agent
- Marketing Agent

---

## 6. AI workflow

### 6.1 Success path

```
New Lead Created
  → Analyze Lead
  → Save Analysis
  → Create Follow-Up Task
  → Record Activity
```

Aligned with product steps:

1. New Lead  
2. Analyze Lead  
3. Save Analysis to CRM Lead  
4. Create Follow-Up Task  
5. Record Activity  

### 6.2 Failure handling

If AI analysis fails:

- The **lead remains saved** (no data loss).
- Failure is recorded as an **activity** and/or **error state** on the workflow execution.
- The user can open the lead, review, and take action (manual status/next steps).
- Follow-up task creation depends on a successful analysis path; on analysis failure, do not invent analysis data. Record the failure clearly so the UI can show an error state.

---

## 7. Security flow

Every protected request follows:

```
Authentication
  → Authorization
  → Ownership Check
  → Validation
  → Business Logic
```

### 7.1 Rules

- Passwords hashed at rest.
- Authentication required except for public auth endpoints (register/login as designed).
- Backend authorization plus ownership checks.
- Input validation on the server.
- Secrets only in environment variables (never in the React client).
- Users can access **only their own data**.
- HTTPS in production.
- Production CORS limited to the Vercel frontend origin(s).

### 7.2 Frontend vs backend

| Concern | Frontend | Backend |
| --- | --- | --- |
| Hide login-gated screens | Yes (UX) | — |
| Enforce access | No | Yes |
| Ownership | Do not trust client-supplied owner IDs | Always derive owner from authenticated user |
| Validation | For immediate feedback | Authoritative |

---

## 8. Data flow

### 8.1 Registration / login

```
User → React → Express API (/api/auth) → MongoDB (users)
```

### 8.2 Lead creation

```
User → React → Leads API (/api/leads) → MongoDB (leads)
  → Workflow → AI Integration → Follow-up Task → Activity
```

Persist the lead first, then run the workflow so a failed analysis cannot drop the lead.

### 8.3 Dashboard

```
User → React Dashboard → Dashboard API (/api/dashboard)
  → MongoDB (user-owned data) → Dashboard
```

Counts and recent activities are scoped to the authenticated user.

### 8.4 Analytics

```
User → React Analytics → Analytics API (/api/analytics)
  → aggregations over leads, agents, workflows/executions, activities, follow-up tasks
```

No dedicated analytics store.

---

## 9. Deployment

```
User
  → Vercel (React frontend)
  → HTTPS
  → Render (Node.js / Express backend)
  → MongoDB
```

Environment variables on Render hold database URI, auth secrets, CORS origin, and (later) AI provider keys. The Vercel app holds only the public API base URL, not server secrets.

---

## 10. Explicit non-architecture (MVP)

The following are **out of scope** and must not appear as services or collections in v1.0:

- Team/invitation/admin services
- WhatsApp, email, SMS, or social automations
- Webhooks
- Microservices split
- Billing
- Visual or branching workflow engine
- Workflow scheduler
- Advanced CRM subsystems beyond listed lead capabilities

---

## 11. Related documents

- `PRD.md` — product requirements and MVP scope  
- `docs/UI-UX-PLAN.md` — screens, components, and user flows  
