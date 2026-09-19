# BizFlow AI — UI/UX Plan (MVP v1.0)

**Product:** BizFlow AI — Business Automation Platform  
**Source of truth:** `PRD.md` (this plan does not expand MVP scope)  
**Status:** Documentation only — no frontend implementation in this step

This document is the complete UI/UX specification for the 12 approved MVP screens. It defines layout, navigation, components, states, accessibility, and user flows so implementation can follow without inventing features.

---

## 1. Product and design goals

BizFlow AI is a centralized workspace for freelancers, startup founders, small business owners, and small internal teams (single-account usage in v1.0).

The UI must help users:

- Capture and update leads
- Configure bounded AI agents (Sales, Customer Support, Marketing)
- Understand the fixed New Lead follow-up workflow
- Review activities and basic metrics
- Manage profile and account settings
- Review AI output as humans (analysis and suggested next step are always readable)

**Problem the UI must make obvious:** leads, follow-ups, and activity are no longer scattered — status, analysis, tasks, and workflow outcome live in one place.

---

## 2. Design system

### 2.1 Visual language

- Modern SaaS, clean, professional
- Neutral page background; white/elevated cards; one primary action color
- Semantic status colors for success, warning, error, and info
- Status is never color-only (badge text + color)
- Dense but readable tables on large screens; cards on small screens
- Consistent spacing scale and typography scale
- Rounded cards, subtle borders, light shadows
- Reusable components over one-off layouts

### 2.2 Interaction principles

- One primary action per view
- Destructive actions require confirmation
- Frontend validation for immediate feedback; backend remains authoritative
- Route guards hide screens for UX only (not security)
- AI failure is explicit: lead still visible; analysis card in error; execution/activity records the failure

### 2.3 Breakpoints

| Name | Behavior |
| --- | --- |
| Desktop / laptop | Persistent sidebar; multi-column stats; full tables |
| Tablet | Collapsible/narrower sidebar; tables may scroll horizontally |
| Mobile | Sidebar hidden; header menu opens a drawer; stacked forms; cards instead of wide tables |

---

## 3. Information architecture

### 3.1 Screens (exactly 12)

| # | Screen | Route (frontend) |
| --- | --- | --- |
| 1 | Registration | `/register` |
| 2 | Login | `/login` |
| 3 | Dashboard | `/dashboard` |
| 4 | Leads List | `/leads` |
| 5 | Add Lead | `/leads/new` |
| 6 | Lead Details/Edit | `/leads/:id` and `/leads/:id/edit` |
| 7 | AI Agents List | `/agents` |
| 8 | Create Agent | `/agents/new` |
| 9 | Edit Agent | `/agents/:id/edit` |
| 10 | Workflows | `/workflows` |
| 11 | Analytics | `/analytics` |
| 12 | Profile & Settings | `/settings` |

Unauthenticated users who open app routes are sent to Login.

### 3.2 Navigation (authenticated)

Sidebar (and the same items in the mobile drawer):

- Dashboard  
- Leads  
- AI Agents  
- Workflows  
- Analytics  
- Profile & Settings  
- Logout  

Logout may also appear in the header user area. Both trigger the same logout flow.

**Do not add nav items for:** team, billing, admin, channel automations, workflow builder.

---

## 4. Global layout

### 4.1 Auth layout (Registration, Login)

- Full-viewport background
- Centered card
- No sidebar
- Link between Login and Registration

### 4.2 App shell (all other screens)

| Region | Role |
| --- | --- |
| Sidebar | Primary navigation; current route `aria-current="page"` |
| Header | Page title, user identity, mobile menu control, optional logout |
| Main | Page content |
| Mobile nav | Header control opens the same nav as the sidebar; overlay + Escape to dismiss; focus trap while open |

### 4.3 Accessibility (global)

- Keyboard access to all actions
- Visible focus rings
- Labels on every input and select
- Validation messages tied to fields (`aria-describedby`)
- Sufficient contrast
- Buttons and links, not unlabeled divs
- Toasts/alerts use live regions; do not steal focus except when a blocking error needs the first invalid field
- Confirm dialogs return focus to the invoker

---

## 5. Reusable components

Use these across screens. Do not invent parallel widgets.

| Component | Use |
| --- | --- |
| App Shell | Sidebar + header + main |
| Sidebar | Primary nav |
| Header | Title, user, mobile menu |
| Button | Primary, secondary, danger, ghost, icon |
| Input | Text, email, password, search |
| Select | Status, agent type, filters |
| Card | Grouped content |
| Badge | Lead status, agent active/inactive, execution status |
| Table | Lists on desktop/laptop |
| Modal | Rare secondary flows |
| Toast | Transient success/error after mutations |
| Alert | Inline page/section messages |
| Confirm Dialog | Delete lead; logout if confirmed |
| Loading Skeleton | Page and table placeholders |
| Empty State | No rows yet + one primary CTA |
| Error State | Load/action failure + Retry when safe |
| Stat Card | Dashboard and analytics KPIs |
| Chart Card | Simple analytics visuals with a text/numeric alternative |
| Workflow Step | The five fixed New Lead workflow steps |
| Activity Timeline | Dashboard, lead, and workflow context |

**Lead status badges (closed set):** New, Contacted, Qualified, Converted, Lost.

**Agent type (closed set):** Sales Agent, Customer Support Agent, Marketing Agent.

---

## 6. Cross-cutting states

| State | Pattern |
| --- | --- |
| Loading | Skeletons for GET; disabled button + spinner for mutations; prevent double submit |
| Empty | Clear copy + one CTA (usually Add lead or Create agent) |
| Error | Alert or Error State; Retry for GET; generic auth errors (do not reveal whether an email exists) |
| Success | Toast for mutations; navigate when the flow is complete |
| AI pending | Lead saved; analysis card shows pending |
| AI failure | Lead remains; analysis card error; activity and/or execution error state; user can act manually |

---

## 7. User flows

```
Registration → Login → Dashboard

Dashboard → Leads → Add Lead → New Lead workflow
  (lead saved first; analysis saved or failure recorded;
   follow-up task on success path; activity always recorded)

Leads → Lead Details → Edit → Update
Leads → Lead Details → Delete (confirm) → Leads List

AI Agents → Create / Edit → Activate / Deactivate

Workflows → View New Lead Follow-Up → View execution status

Analytics → View metrics (from operational data)

Profile → Update → Logout
```

Protected routes: if unauthenticated, redirect to Login. After login, land on Dashboard.

---

## 8. Screen specifications

Each screen below includes purpose, layout, components, forms, buttons, tables/cards, validation, loading, empty, error, success, responsive behavior, and accessibility.

---

### Screen 1 — Registration

**Purpose:** Create an account with validated credentials.

**Layout:** Auth layout; single card; link to Login.

**Components:** Card, Input, Button, Alert, Toast (optional).

**Forms:**

- Email (required)
- Password (required)
- Confirm password (required, must match)
- Optional display name (keep signup minimal)

**Buttons:** Primary “Create account”; text link “Already have an account? Log in”.

**Tables/cards:** One auth Card.

**Validation:** Required fields; email format; password length helper; confirm match; duplicate email shown from the API as Alert.

**Loading:** Submit disabled; in-button loading.

**Empty:** N/A.

**Error:** Field errors + Alert for API/network.

**Success:** Confirmation then Login, or session then Dashboard — must not skip authentication requirements.

**Responsive:** Full-width card on mobile; constrained width on desktop.

**Accessibility:** Labels; show-password control; errors on `aria-describedby`; focus first error.

---

### Screen 2 — Login

**Purpose:** Authenticate and enter the protected app.

**Layout:** Same auth layout as Registration; link to Registration.

**Components:** Card, Input, Button, Alert.

**Forms:** Email; Password.

**Buttons:** Primary “Log in”; text link “Create an account”.

**Tables/cards:** One auth Card.

**Validation:** Required email and password; email format; generic failure (do not disclose whether the email exists).

**Loading:** Button loading; form locked.

**Empty:** N/A.

**Error:** Alert for invalid credentials, network, or server error.

**Success:** Navigate to Dashboard; session used for later API calls.

**Responsive:** Same as Registration.

**Accessibility:** Labels; autofocus email; same error pattern as Registration.

---

### Screen 3 — Dashboard

**Purpose:** Show, for the signed-in user only: total leads, active AI agents, active workflows, recent activities, and basic statistics consistent with Analytics.

**Layout:** App shell. Welcome/header area, Stat Card grid, lead-status summary, recent Activity Timeline, shortcuts.

**Components:** App Shell, Stat Card, Card, Chart Card (simple), Activity Timeline, Badge, Button, Loading Skeleton, Empty State, Error State.

**Forms:** None.

**Buttons:** Optional shortcuts only — Add lead, View leads, View agents (navigate; no extra features).

**Tables/cards:**

- Stat Cards: Total leads, Active AI agents, Active workflows
- Basic statistics (e.g. leads by the five statuses)
- Recent activities timeline

**Validation:** N/A.

**Loading:** Skeletons for stats, chart, and timeline.

**Empty:** Empty State if no leads/activities, CTA Add lead.

**Error:** Error State + Retry.

**Success:** Data rendered; no toast required on initial load.

**Responsive:** Stat grid 4 / 2 / 1 columns (desktop / tablet / mobile). Timeline full width.

**Accessibility:** Stat values in text; timeline items have timestamps and readable action text.

---

### Screen 4 — Leads List

**Purpose:** Browse the user’s leads; open add and details.

**Layout:** App shell. Header action + optional status filter. Table on large screens; cards on mobile.

**Components:** App Shell, Button, Input (optional simple search of listed fields only — not advanced CRM), Select (All + five statuses), Table, Badge, Empty State, Loading Skeleton, Error State.

**Forms:** Filter controls only.

**Buttons:** Primary “Add lead”; row “View” / open.

**Tables/cards:** Name, contact, status, updated, suggested next step (truncated). Mobile cards: name, status badge, next step.

**Validation:** Filter values limited to allowed statuses.

**Loading:** Table/card skeletons.

**Empty:** “No leads yet” + Add lead.

**Error:** Load failure + Retry.

**Success:** Toast after returning from create/delete if applicable.

**Responsive:** Horizontal scroll table vs stacked cards.

**Accessibility:** Table headers; row open is a link/button (keyboard); status not color-only.

---

### Screen 5 — Add Lead

**Purpose:** Create a lead. Saving starts the fixed workflow: New Lead → Analyze Lead → Save Analysis to CRM Lead → Create Follow-Up Task → Record Activity. Persist the lead first so AI failure cannot drop it.

**Layout:** App shell. Form Card. Optional notice that save runs the New Lead follow-up.

**Components:** App Shell, Card, Input, Select, Button, Alert, Toast.

**Forms (MVP CRM only — no custom fields, imports, or extra pipelines):**

- Name (required)
- Email and/or phone (enough contact to follow up: at least one)
- Company (optional)
- Notes (optional)
- Status: default **New**; Select of the five statuses

**Buttons:** Primary “Save lead”; Secondary “Cancel” (back to list).

**Tables/cards:** Form Card.

**Validation:** Required name; contact; email format if present; status enum.

**Loading:** Submit disabled; optional “Saving lead…”.

**Empty:** N/A.

**Error:** Validation/API Alert. If the lead saves but analysis fails, treat save as **success** and show a non-blocking Alert that analysis failed and was recorded.

**Success:** Toast “Lead saved”; prefer navigate to Lead Details.

**Responsive:** Single column on mobile; optional two-column contact fields on desktop.

**Accessibility:** Required fields marked; workflow notice in text; announce save result.

---

### Screen 6 — Lead Details / Edit

**Purpose:** View and update a lead: details, status, AI analysis, suggested next step; delete; review related activity/follow-up.

**Layout:** App shell. Desktop: details form + side panel (analysis, next step, activity). Mobile: stacked.

**Components:** App Shell, Card, Input, Select, Badge, Button, Alert, Toast, Confirm Dialog (delete), Activity Timeline, Empty/Error on analysis card.

**Forms:** Same fields as Add, plus read-only created/updated if available.

**Buttons:** Primary “Save changes”; Secondary back to list; Danger “Delete lead” (Confirm Dialog); Status Select (five values only).

**Tables/cards:** Details; AI analysis (human-reviewable text); suggested next step; optional follow-up task summary (view-only); activity timeline.

**Validation:** Same as Add; status enum only.

**Loading:** Skeleton on fetch; save button loading.

**Empty:** Analysis pending — “Analysis pending”. Analysis failed — error on analysis card; lead data still shown.

**Error:** Not found / not owned — Error State, no other users’ data. Save/delete errors in Alert.

**Success:** Toast on update; on delete, toast and return to Leads List.

**Responsive:** Side panel below form on tablet/mobile.

**Accessibility:** Delete confirm keyboard-complete; analysis in text, not image-only.

---

### Screen 7 — AI Agents List

**Purpose:** List the user’s Sales, Customer Support, and Marketing agents; create/edit; show Active/Inactive.

**Layout:** App shell. Header + Create agent. Table or cards.

**Components:** App Shell, Button, Table, Card, Badge, Empty State, Loading Skeleton, Error State, optional Select filter (type / active).

**Forms:** Optional filters only.

**Buttons:** Primary “Create agent”; row “Edit”; Activate / Deactivate (list or edit — same actions).

**Tables/cards:** Name, type, status badge, updated.

**Validation:** Filters limited to three types + active flags.

**Loading:** Skeletons.

**Empty:** “No agents yet” + Create agent.

**Error:** Retry on load failure.

**Success:** Toast after activate/deactivate from this screen.

**Responsive:** Table vs cards.

**Accessibility:** Activate/Deactivate are named buttons (“Deactivate Sales Agent …”).

---

### Screen 8 — Create Agent

**Purpose:** Create a Sales, Customer Support, or Marketing agent **configuration** (not a messaging channel).

**Layout:** App shell. Form Card.

**Components:** App Shell, Card, Input, Select, Button, Alert, Toast.

**Forms:**

- Name (required)
- Type (required): Sales Agent | Customer Support Agent | Marketing Agent
- Instructions / configuration text (user-editable bounded config)
- Active toggle

No WhatsApp, email, SMS, or social connectors.

**Buttons:** Save; Cancel to list.

**Tables/cards:** Form Card.

**Validation:** Name required; type enum only.

**Loading:** Submit loading.

**Empty:** N/A.

**Error:** Alert on API failure.

**Success:** Toast; navigate to list or Edit.

**Responsive:** Single column.

**Accessibility:** Type labeled; Active toggle named.

---

### Screen 9 — Edit Agent

**Purpose:** Update configuration; activate or deactivate. PRD does not include agent delete — **do not add a delete control**.

**Layout:** Same as Create, plus status Badge.

**Components:** Same as Create; optional Confirm Dialog if deactivating is framed as consequential.

**Forms:** Same fields, prefilled.

**Buttons:** Save changes; Activate or Deactivate; Cancel.

**Tables/cards:** Form Card; Active/Inactive Badge.

**Validation:** Same as Create.

**Loading:** Fetch skeleton; save/toggle loading.

**Empty:** N/A (not found → error).

**Error:** Not found / not owned; save errors.

**Success:** Toast on save or status change.

**Responsive:** Single column.

**Accessibility:** Status change announced; focus after save.

---

### Screen 10 — Workflows

**Purpose:** View the **fixed** New Lead Follow-Up workflow and execution status. No builder, branching, or scheduling UI.

**Layout:** App shell. Definition Card with Workflow Step stepper (five steps). Executions Table/Cards with status badges.

**Components:** App Shell, Card, Workflow Step, Table, Badge, optional Activity Timeline for a selected execution, Empty State, Loading Skeleton, Error State, Alert.

**Forms:** Optional execution status filter (e.g. running, succeeded, failed).

**Buttons:** View/expand execution (read-only). No “create workflow” or “add step”.

**Tables/cards:**

- Definition: New Lead → Analyze Lead → Save Analysis to CRM Lead → Create Follow-Up Task → Record Activity
- Executions: lead reference, started, status (including error), step reached

**Validation:** Filter enums only.

**Loading:** Skeletons.

**Empty:** “No workflow runs yet. Create a lead to start the New Lead follow-up.”

**Error:** API Error State + Retry. Failed executions show error Badge + message, not a blank page.

**Success:** Read-only; no toast on load.

**Responsive:** Stepper horizontal on desktop, vertical on mobile. Executions as cards on mobile.

**Accessibility:** Steps as an ordered list; failed/current step not color-only; table caption.

---

### Screen 11 — Analytics

**Purpose:** Lead statistics, agent activity, workflow activity, and basic business metrics — **computed from operational data** (no analytics collection, no custom reports, no export).

**Layout:** App shell. Stat Cards + Chart Cards.

**Components:** App Shell, Stat Card, Chart Card, Card, Loading Skeleton, Empty State, Error State, optional Select (group by lead status). Default to all-time user-owned data; do not add scheduling or advanced date-range product.

**Forms:** Optional grouping Select only.

**Buttons:** None required; optional “View leads” link.

**Tables/cards:**

- Lead statistics (totals and counts by status)
- Agent activity (e.g. active vs inactive, derived usage)
- Workflow activity (execution counts, success vs failure)
- Basic business metrics (e.g. converted vs lost)

**Validation:** Enum filter only if present.

**Loading:** Skeleton grid.

**Empty:** Empty State if no operational data.

**Error:** Error State + Retry.

**Success:** Charts/stats render.

**Responsive:** Full-width stacked cards on mobile.

**Accessibility:** Each Chart Card includes a text or table alternative for key numbers.

---

### Screen 12 — Profile & Settings

**Purpose:** View/update profile information and account settings; log out. No billing, team, or provider API-key UI (secrets stay on the server).

**Layout:** App shell. Profile Card; Account Card.

**Components:** App Shell, Card, Input, Button, Alert, Toast, optional Confirm Dialog (logout).

**Forms:**

- Profile: display name; email (read-only if `/api/profile` does not support change)
- Account: password change (current, new, confirm) if included as account settings

**Buttons:** Save profile; Save password if present; Logout.

**Tables/cards:** Profile Card; Account Card.

**Validation:** Name rules; email format if editable; password rules and confirm match.

**Loading:** Page skeleton; save buttons loading.

**Empty:** N/A.

**Error:** Alert on save failure.

**Success:** Toast “Profile updated”; logout returns to Login and ends the session.

**Responsive:** Stacked cards.

**Accessibility:** Logout is a button; password fields labeled; status announced.

---

## 9. Content, copy, and empty/error language

| Situation | Copy direction |
| --- | --- |
| No leads | “No leads yet” + Add lead |
| No agents | “No agents yet” + Create agent |
| No workflow runs | Explain that creating a lead starts New Lead Follow-Up |
| Analysis pending | “Analysis pending” on the analysis card |
| Analysis failed | Lead is saved; analysis failed and was recorded; review and continue manually |
| Auth failure | Generic “Email or password is incorrect” |
| Not found / not owned | Generic not found — no leak of other users’ data |

Tone: professional, short, factual. Do not claim channel automations or team features.

---

## 10. Responsive behavior (summary)

| Surface | Desktop / laptop | Tablet | Mobile |
| --- | --- | --- | --- |
| Shell | Sidebar visible | Collapsible | Drawer |
| Lists | Table | Table + scroll | Cards |
| Forms | 1–2 columns | 1–2 columns | 1 column |
| Dashboard / analytics | Multi-column stats | 2 columns | 1 column |
| Workflow steps | Horizontal | Wrap or vertical | Vertical |

---

## 11. Accessibility checklist (implementation)

- [ ] Keyboard path through nav, tables, dialogs, and forms  
- [ ] Visible focus  
- [ ] Labels and validation messages  
- [ ] Contrast on text, badges, and charts  
- [ ] Accessible controls (button, link, dialog, switch)  
- [ ] Status and AI errors available as text  
- [ ] Confirm dialogs restore focus  

---

## 12. Out of scope (do not design or build)

Per PRD §2.2 and related exclusions:

- Team management, invitations, admin portal  
- WhatsApp, email, SMS, social automation UIs  
- Visual workflow builder, branching, scheduling  
- Webhooks, billing, microservices consoles  
- Advanced CRM (imports, custom pipelines, bulk tools, extra fields)  

AI remains bounded and human-reviewable. Provider integration is deferred; the UI must still show analysis, pending, and failure states.

---

## 13. Related documents

- `PRD.md` — product requirements (source of truth)  
- `docs/architecture.md` — layers, data flow, security, deployment  
