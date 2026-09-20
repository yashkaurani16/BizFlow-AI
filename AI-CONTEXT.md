# AI-CONTEXT.md — BizFlow AI Rapid Reference

A concise operational cheat sheet for AI assistants and context engines working on **BizFlow AI**.

---

## At a Glance

| Item | Specification |
| :--- | :--- |
| **Product** | BizFlow AI — AI-Powered Business Automation Platform |
| **Version** | MVP v1.0 (Milestones: Steps 18–24 Completed) |
| **Frontend** | React 19 + React Router 7 + Vite (Port: 5176 / 5173) |
| **Backend** | Node.js + Express (Port: 5000) |
| **Database** | MongoDB + Mongoose (with offline in-memory dev fallback) |
| **AI Provider** | Google Gemini 2.5 Flash via `@google/genai` (Server-side) |
| **Communication** | Email, WhatsApp, SMS via Provider-Agnostic Sandbox Adapters |
| **Security** | JWT, Security Headers, Rate Limiting, NoSQL Sanitizer, ObjectId Guards |
| **Deployments** | Vercel (Frontend SPA) + Render (Backend Web Service) |

---

## Key File Locations

- **Backend Entry**: [`backend/src/server.js`](backend/src/server.js)
- **Express App & Middleware**: [`backend/src/app.js`](backend/src/app.js)
- **Database Connection**: [`backend/src/config/database.js`](backend/src/config/database.js)
- **Gemini AI Service**: [`backend/src/services/ai/aiService.js`](backend/src/services/ai/aiService.js)
- **Communication Dispatcher**: [`backend/src/services/communications/communicationService.js`](backend/src/services/communications/communicationService.js)
- **Workflow Engine**: [`backend/src/services/workflowEngine.js`](backend/src/services/workflowEngine.js)
- **Frontend Entry**: [`frontend/src/main.jsx`](frontend/src/main.jsx)
- **API Client**: [`frontend/src/services/api.js`](frontend/src/services/api.js)
- **Visual Workflow Builder**: [`frontend/src/components/workflow-builder/WorkflowBuilder.jsx`](frontend/src/components/workflow-builder/WorkflowBuilder.jsx)
- **Analytics Dashboard**: [`frontend/src/pages/AnalyticsPage.jsx`](frontend/src/pages/AnalyticsPage.jsx)
- **Vercel Config**: [`frontend/vercel.json`](frontend/vercel.json)
- **Render Config**: [`render.yaml`](render.yaml)

---

## Environment Variable Schema

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bizflow_ai
CLIENT_URL=http://localhost:5176,http://localhost:5173
JWT_SECRET=bizflow_ai_development_jwt_secret_key_2026
NODE_ENV=development

# AI Settings (Server-side only)
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
AI_API_KEY=your_gemini_api_key_here

# External Communication Providers (Sandbox mode by default)
EMAIL_PROVIDER=sandbox
WHATSAPP_PROVIDER=sandbox
SMS_PROVIDER=sandbox
```

### Frontend (`frontend/.env.local` or Vercel Environment)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Mandatory Safety & Security Directives

1. **Human Approval Required**: Every communication draft must have `humanReviewRequired: true`. Any attempt to send with `humanApproved !== true` returns HTTP 400.
2. **Sandbox Protection**: All external messaging is simulated by default; no real carrier networks are contacted without explicit production provider setup.
3. **Multi-Tenant Isolation**: Query filtering must strictly use `{ owner: req.user._id }`. Unowned records return HTTP 404.
4. **NoSQL Sanitization**: All incoming keys starting with `$` or containing `.` are blocked with HTTP 400.
5. **ObjectId Guard**: Route params (`:id`) must pass 24-character hexadecimal regex validation before Mongoose execution.
6. **Error Masking**: Stack traces and internal paths must never be returned in HTTP error payloads.
7. **Zero Secrets**: Never commit real API keys or `.env` files. `backend/.env` is strictly git-ignored.

---

## Commands Cheat Sheet

```powershell
# Run all tests (Steps 18–24)
cd backend; npm.cmd run test:all

# Frontend Lint & Production Build
cd frontend; npm.cmd run lint; npm.cmd run build
```
