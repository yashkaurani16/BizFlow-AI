# BizFlow AI — Product Requirements Document (PRD)

**Product:** BizFlow AI — Business Automation Platform  
**Version:** MVP v1.0  
**Status:** Approved specification (documentation only; implementation follows later)

---

## 1. Product overview

BizFlow AI is a centralized workspace for freelancers, startups, small businesses, and small teams to manage leads, AI agent configurations, lead follow-up automation, activities, and basic business metrics.

### 1.1 Purpose

Give users one place to:

- Capture and update leads (CRM)
- Configure bounded AI agents (Sales, Customer Support, Marketing)
- Run a fixed MVP follow-up workflow when a new lead is created
- Review activities and basic analytics
- Manage profile and account settings

### 1.2 Problem

Business leads, follow-ups, and customer activity are often scattered across spreadsheets, notes, inboxes, and messaging tools. That fragmentation makes it hard to know who to contact next, what was already done, and whether automation actually ran.

### 1.3 MVP users

- Freelancers
- Startup founders
- Small business owners
- Small internal teams

MVP does **not** include team management, invitations, or an admin portal. Small teams may share a single account in v1.0; multi-user tenancy is out of scope.

---

## 2. Goals and non-goals

### 2.1 MVP goals

1. Authenticated users can register, log in, log out, and use a protected dashboard.
2. Users can fully CRUD their own leads and track status through the defined pipeline.
3. Users can create, edit, activate, and deactivate AI agents of the three allowed types.
4. Creating a new lead triggers one fixed workflow: analyze → save analysis → create follow-up task → record activity.
5. If AI analysis fails, the lead is still saved; failure is recorded; the user can review and act.
6. Users can view lead, agent, workflow, and basic business metrics derived from operational data.
7. Users can update profile/account settings and log out.

### 2.2 MVP exclusions (must not be built in v1.0)

- Team management
- Invitations
- Admin portal
- WhatsApp automation
- Email automation
- SMS automation
- Social media automation
- Visual workflow builder
- Branching workflows
- Workflow scheduling
- Webhooks
- Microservices
- Billing
- Advanced CRM features (beyond the lead fields and statuses listed below)

### 2.3 AI constraints

- AI must be **bounded** (only the approved agent types and the fixed new-lead workflow).
- AI output must be **human-reviewable** (shown on lead details; users can edit leads and act on follow-up tasks).
- **Actual AI provider integration is deferred** to the API integration stage. Architecture and APIs must leave a clear AI integration layer; MVP implementation of that layer may use stubs until integration.

---

## 3. Tech stack (MVP)

| Layer | Technology |
| --- | --- |
| Frontend | React |
| Frontend deployment | Vercel |
| Backend | Node.js + Express |
| Backend deployment | Render |
| Database | MongoDB |
| API style | REST |

**Deployment path:** User → Vercel React frontend → HTTPS → Render Node.js/Express backend → MongoDB.

---

## 4. Functional requirements

### 4.1 Authentication

| Capability | Requirement |
| --- | --- |
| Registration | User can create an account with validated credentials. |
| Login | User can authenticate and receive a session/token usable by the API. |
| Logout | User can end the session; subsequent protected requests fail until login. |
| Protected dashboard | Unauthenticated users cannot access dashboard or other app screens; they are sent to login. |

**Security (product-level):**

- Passwords must be hashed (never stored in plaintext).
- Authentication required for all non-auth API groups.
- Backend authorization and **ownership checks** (users access only their own data).
- Input validation on the server.
- Secrets in environment variables.
- HTTPS in production.
- Proper production CORS (Vercel origin(s) only as configured).

The **backend is the security boundary**. Frontend route guards are for UX only.

### 4.2 Dashboard

The dashboard must show, for the authenticated user only:

- Total leads
- Active AI agents
- Active workflows
- Recent activities
- Basic statistics (consistent with Analytics, summarized for home)

### 4.3 CRM / Leads

Users can:

- Add lead
- View lead
- Update lead
- Delete lead
- Set/view **lead status**
- View **lead details**
- View **AI analysis** (when available)
- View **suggested next step** (when available)

**Lead statuses (fixed set):**

- New
- Contacted
- Qualified
- Converted
- Lost

Ownership: every lead belongs to exactly one user. List, get, update, and delete must be scoped to the owner.

### 4.4 AI Agents

**Allowed types (fixed):**

- Sales Agent
- Customer Support Agent
- Marketing Agent

Users can:

- Create
- Edit
- Activate
- Deactivate

Agents are configuration records owned by the user. They do not imply messaging-channel automation (excluded).

### 4.5 Workflow automation

**Fixed MVP workflow only** (no builder, no branching, no scheduling):

1. New Lead  
2. → Analyze Lead  
3. → Save Analysis to CRM Lead  
4. → Create Follow-Up Task  
5. → Record Activity  

**If AI analysis fails:**

- The lead remains saved (no data loss).
- Failure is recorded as an activity and/or error state on the execution.
- The user can review the lead and take action manually.

### 4.6 Analytics

Must include:

- Lead statistics
- Agent activity
- Workflow activity
- Basic business metrics

Analytics are **calculated from existing operational data**. There is **no separate analytics collection**.

### 4.7 Profile & Settings

- Profile information (view/update)
- Account settings
- Logout

---

## 5. Screens (MVP)

Exactly these 12 screens:

1. Registration  
2. Login  
3. Dashboard  
4. Leads List  
5. Add Lead  
6. Lead Details/Edit  
7. AI Agents List  
8. Create Agent  
9. Edit Agent  
10. Workflows  
11. Analytics  
12. Profile & Settings  

Detailed layout, components, and states are specified in `docs/UI-UX-PLAN.md`.

---

## 6. API groups (planned)

REST groups on the Express backend:

| Group | Purpose |
| --- | --- |
| `/api/auth` | Registration, login, logout/session |
| `/api/dashboard` | Aggregated home metrics and recent activities |
| `/api/leads` | Lead CRUD, status, analysis fields |
| `/api/agents` | Agent CRUD, activate/deactivate |
| `/api/workflows` | Workflow definition view + execution status (fixed MVP workflow) |
| `/api/analytics` | Computed lead/agent/workflow/business metrics |
| `/api/profile` | Profile and account settings |

Endpoint-level contracts are not expanded in this PRD beyond groups; they will be defined at the API implementation stage without expanding product scope.

---

## 7. Data entities (product view)

Owned by a user (one-to-many):

- Users  
- Leads  
- Agents  
- Workflows  
- Workflow executions  
- Follow-up tasks  
- Activities  

See `docs/architecture.md` for collections and relationships.

---

## 8. Success criteria (MVP)

MVP v1.0 is successful when:

1. A new user can register, log in, and land on a protected dashboard.
2. The user can create a lead and see it in the list and details views.
3. Creating a lead starts the fixed New Lead workflow; analysis (or a recorded failure) appears on the lead; a follow-up task and activity are created according to the success/failure rules.
4. The user can change lead status among the five allowed values and edit/delete their own leads only.
5. The user can create/edit Sales, Support, and Marketing agents and toggle active/inactive.
6. Dashboard and Analytics reflect that user’s operational data only.
7. Passwords are hashed; unauthorized and cross-user access is rejected by the API.

---

## 9. Out-of-scope reminder

Anything in **§2.2 MVP exclusions** is not part of v1.0. Do not add team features, channel automations, billing, webhooks, microservices, workflow builders, or advanced CRM in this version.

---

## 10. Related documents

- `docs/architecture.md` — system architecture, security flow, data flow, deployment  
- `docs/UI-UX-PLAN.md` — complete UI/UX plan for all 12 screens  
