# BizFlow AI — Business Automation Platform

**Version:** MVP v1.0  
**Status:** Approved scope. Documentation and project structure in place.

BizFlow AI is a centralized workspace for freelancers, startups, small businesses, and small teams to manage leads, AI agent configurations, lead follow-up automation, activities, and basic business metrics.

## Problem

Business leads, follow-ups, and customer activity are often scattered across spreadsheets, notes, inboxes, and messaging tools.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React (deployed on Vercel) |
| Backend | Node.js + Express (deployed on Render) |
| Database | MongoDB |
| API | REST |

**Production path:** User → Vercel React frontend → HTTPS → Render Node.js/Express backend → MongoDB.

## MVP users

- Freelancers
- Startup founders
- Small business owners
- Small internal teams

## MVP scope

1. **Authentication** — registration, login, logout, protected dashboard  
2. **Dashboard** — total leads, active AI agents, active workflows, recent activities, basic statistics  
3. **CRM / Leads** — add, view, update, delete; status; details; AI analysis; suggested next step  
4. **AI Agents** — Sales, Customer Support, Marketing; create, edit, activate, deactivate  
5. **Workflow automation** — one fixed New Lead follow-up workflow  
6. **Analytics** — lead, agent, workflow, and basic business metrics (from operational data)  
7. **Profile & Settings** — profile, account settings, logout  

### Lead statuses

New · Contacted · Qualified · Converted · Lost

### Fixed workflow

New Lead → Analyze Lead → Save Analysis to CRM Lead → Create Follow-Up Task → Record Activity  

If AI analysis fails, the lead remains saved, the failure is recorded, and the user can review and act.

## Out of scope (MVP)

Team management, invitations, admin portal, WhatsApp/email/SMS/social automation, visual workflow builder, branching workflows, workflow scheduling, webhooks, microservices, billing, advanced CRM.

AI must be bounded and human-reviewable. Actual AI provider integration is deferred to the API integration stage.

## Screens (12)

Registration, Login, Dashboard, Leads List, Add Lead, Lead Details/Edit, AI Agents List, Create Agent, Edit Agent, Workflows, Analytics, Profile & Settings.

## Planned API groups

`/api/auth` · `/api/dashboard` · `/api/leads` · `/api/agents` · `/api/workflows` · `/api/analytics` · `/api/profile`

## Security (backend is the security boundary)

- Hashed passwords  
- Authentication required  
- Backend authorization and ownership checks  
- Input validation  
- Secrets in environment variables  
- Users can access only their own data  
- HTTPS in production  
- Proper production CORS  

Frontend checks are for UX only.

## Repository layout

```
BizFlow-AI/
  PRD.md
  README.md
  .gitignore
  docs/
    architecture.md
    UI-UX-PLAN.md
  frontend/
    src/
      pages/
      components/
      layouts/
      routes/
      services/
      hooks/
      utils/
      styles/
  backend/
    src/
      routes/
      controllers/
      middleware/
      models/
      services/
      validators/
      utils/
    .env.example
```

## Documents

- [`PRD.md`](PRD.md) — product requirements  
- [`docs/architecture.md`](docs/architecture.md) — system architecture  
- [`docs/UI-UX-PLAN.md`](docs/UI-UX-PLAN.md) — UI/UX for all 12 screens  

## Local development

Package install and runtime setup are not part of this structure step. Backend application code is not included yet. Copy `backend/.env.example` when implementing the API.

## License

Private student project unless otherwise specified.
