/**
 * BizFlow AI — Step 18 Comprehensive Module & Regression Tests
 * Verifies all 20 modules: AI Provider config, fallback execution,
 * invalid key handling, provider unavailable, helper drafts, lead creation,
 * workflow execution, AI analysis persistence, task creation, activity creation,
 * human review indicator, inactive agent handling, multi-tenant isolation,
 * /api/ai/status endpoint, and existing modules (Dashboard, Leads, Agents, Workflows,
 * Analytics, Settings/Profile).
 */

import {
  analyzeLead,
  generateFollowUpSuggestion,
  generateMarketingSuggestion,
  generateSupportDraft,
  getAIProviderStatus,
} from '../src/services/ai/aiService.js'
import {
  executeAIRequest,
  generateFallbackAnalysis,
  getProviderConfig,
} from '../src/services/ai/providerAdapter.js'

export async function runStep18FullTests() {
  const BASE_URL = 'http://localhost:5000/api'
  console.log('==================================================================')
  console.log('       BIZFLOW AI — STEP 18 COMPLETE REGRESSION TESTS             ')
  console.log('==================================================================\n')

  const results = { passed: [], failed: [] }

  function assert(num, name, condition, details = '') {
    const label = `Test ${num}: ${name}${details ? ` (${details})` : ''}`
    if (condition) {
      console.log(`[PASS] ${label}`)
      results.passed.push(label)
    } else {
      console.error(`[FAIL] ${label}`)
      results.failed.push(label)
    }
  }

  // 1. AI Provider Configuration
  const initialConfig = getProviderConfig()
  const status = getAIProviderStatus()
  assert(1, 'AI provider configuration inspection', status.success !== false && status.humanReviewRequired === true, `Provider: ${status.provider}, Model: ${status.model}`)

  // 2. Successful AI Analysis (Fallback / Bounded)
  const mockLead = {
    name: 'Marcus Vance',
    company: 'Vance Dynamics',
    email: 'marcus@vancedynamics.com',
    status: 'New',
    budget: '$30,000',
    projectTimeline: 'Within 30 days',
    notes: 'Needs sales pipeline qualification automation',
    score: 88,
  }
  const mockAgent = {
    name: 'Sales Agent',
    type: 'Sales',
    status: 'Active',
    instructions: 'Evaluate inbound B2B software leads and determine qualification tier.',
  }

  const analysisResult = await analyzeLead(mockLead, mockAgent)
  const hasAnalysisFields =
    analysisResult.summary &&
    analysisResult.suggestedNextStep &&
    ['High', 'Medium', 'Low'].includes(analysisResult.leadQuality) &&
    analysisResult.humanReviewRequired === true
  assert(2, 'Successful AI analysis execution', hasAnalysisFields, `Quality: ${analysisResult.leadQuality}, HumanReview: ${analysisResult.humanReviewRequired}`)

  // 3. Invalid API Key Handling
  const savedProvider = process.env.AI_PROVIDER
  const savedKey = process.env.AI_API_KEY
  process.env.AI_PROVIDER = 'gemini'
  process.env.AI_API_KEY = 'AIzaSyFakeKey_NeverLeakMeInLogs'
  let invalidKeyHandled = false
  try {
    const invalidRes = await analyzeLead(mockLead, mockAgent)
    invalidKeyHandled =
      invalidRes.isFallback === true &&
      invalidRes.humanReviewRequired === true &&
      !invalidRes.summary.includes('AIzaSyFakeKey')
  } catch (err) {
    invalidKeyHandled = false
  } finally {
    process.env.AI_PROVIDER = savedProvider || ''
    process.env.AI_API_KEY = savedKey || ''
  }
  assert(3, 'Invalid API key handling', invalidKeyHandled, 'Gracefully degraded to fallback; no secret leaked')

  // 4. Provider Unavailable Handling
  const fallbackDirect = generateFallbackAnalysis(mockLead, mockAgent)
  assert(4, 'Provider unavailable fallback handling', fallbackDirect.isFallback === true && fallbackDirect.summary.length > 10, 'Fallback generates complete qualification notes')

  // 5. Secondary AI helper methods (Support, FollowUp, Marketing)
  const followUpDraft = await generateFollowUpSuggestion(mockLead)
  const supportDraft = await generateSupportDraft('How do I reset my account password?')
  const mktDraft = await generateMarketingSuggestion('Q4 Lead Acceleration Campaign')
  const helpersValid =
    followUpDraft.humanReviewRequired === true &&
    supportDraft.humanReviewRequired === true &&
    mktDraft.humanReviewRequired === true
  assert(5, 'AI helper methods (FollowUp, Support, Marketing)', helpersValid, 'Drafts require human review')

  // Register a dedicated user for full integration testing
  const testUser = {
    name: 'Dr. Evelyn Reed',
    email: `evelyn.reed.${Date.now()}@bizflow.ai`,
    password: 'Password123!',
    company: 'Reed BioTech',
  }
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  }).then((r) => r.json())

  const token = regRes.token
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  // 6. Lead Creation (Triggers Workflow Engine with AI)
  const leadRes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Dr. Evelyn Reed',
      email: 'evelyn@reedbiotech.com',
      company: 'Reed BioTech',
      status: 'New',
      source: 'Website',
      notes: 'Interested in automated laboratory inventory workflows.',
    }),
  }).then((r) => r.json())
  const createdLeadId = leadRes.lead?._id || leadRes.lead?.id
  assert(6, 'Lead creation', leadRes.success && Boolean(createdLeadId), `Lead ID: ${createdLeadId}`)

  // 7. Workflow Execution
  const workflowsRes = await fetch(`${BASE_URL}/workflows`, { headers: authHeaders }).then((r) => r.json())
  const firstWf = workflowsRes.workflows?.[0]
  const wfDetail = await fetch(`${BASE_URL}/workflows/${firstWf?._id}`, { headers: authHeaders }).then((r) => r.json())
  const executions = wfDetail.workflow?.executions || []
  assert(7, 'Workflow execution', executions.length > 0 && executions[0].status === 'Succeeded', `Status: ${executions[0]?.status}`)

  // 8. AI Analysis Saved to Lead
  const leadDetail = await fetch(`${BASE_URL}/leads/${createdLeadId}`, { headers: authHeaders }).then((r) => r.json())
  const leadRecord = leadDetail.lead
  const analysisSaved =
    Boolean(leadRecord?.aiAnalysis) &&
    Boolean(leadRecord?.suggestedNextStep) &&
    leadRecord?.aiMetadata?.humanReviewRequired === true
  assert(8, 'AI analysis saved to lead', analysisSaved, `Analysis: "${leadRecord?.aiAnalysis?.slice(0, 45)}..."`)

  // 9. Follow-Up Task Creation
  const tasks = leadRecord?.tasks || []
  const taskCreated = tasks.length > 0 && tasks[0].status === 'Pending'
  assert(9, 'Follow-up task creation', taskCreated, `Task: "${tasks[0]?.title}"`)

  // 10. Activity Creation
  const activities = leadRecord?.activities || []
  const hasAnalysisActivity = activities.some((a) => a.type === 'lead_analyzed')
  const hasTaskActivity = activities.some((a) => a.type === 'task_created')
  assert(10, 'Activity audit creation', hasAnalysisActivity && hasTaskActivity, `Recorded ${activities.length} activities`)

  // 11. Human-Review Indicator
  const hasHumanReviewNotice =
    leadRecord?.aiMetadata?.humanReviewRequired === true &&
    activities.some((a) => a.description?.includes('Human Review Required') || a.title?.includes('Human Review'))
  assert(11, 'Human-review indicator verification', hasHumanReviewNotice, 'Human Review Required confirmed in metadata & activity trail')

  // 12. Inactive Agent Behavior
  const agentsListRes = await fetch(`${BASE_URL}/agents`, { headers: authHeaders }).then((r) => r.json())
  const salesAgent = agentsListRes.agents.find((a) => a.type === 'Sales')
  await fetch(`${BASE_URL}/agents/${salesAgent._id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ status: 'Inactive' }),
  })

  // Create another lead with inactive sales agent
  const lead2Res = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Arthur Pendelton',
      email: 'arthur@camelot.org',
      company: 'Camelot Technologies',
      status: 'New',
    }),
  }).then((r) => r.json())

  // Verify lead was still saved, but AI workflow skipped processing by inactive agent
  const lead2Saved = lead2Res.success && Boolean(lead2Res.lead?._id || lead2Res.lead?.id)
  const wfDetailAfterInactive = await fetch(`${BASE_URL}/workflows/${firstWf?._id}`, { headers: authHeaders }).then((r) => r.json())
  const recentExec = wfDetailAfterInactive.workflow?.executions?.[0]
  const inactiveAgentHandled =
    lead2Saved &&
    (recentExec?.error?.includes('Inactive') || recentExec?.status === 'Failed')
  assert(12, 'Inactive agent enforcement', inactiveAgentHandled, 'Inactive agent prevented from running AI analysis; lead safely preserved')

  // Re-activate Sales Agent
  await fetch(`${BASE_URL}/agents/${salesAgent._id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ status: 'Active' }),
  })

  // 13. Unauthorized Lead Access (Multi-tenant boundary)
  const otherUserRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'User Infiltrator',
      email: `intruder.${Date.now()}@bizflow.ai`,
      password: 'Password123!',
    }),
  }).then((r) => r.json())
  const unauthAccessRes = await fetch(`${BASE_URL}/leads/${createdLeadId}`, {
    headers: { Authorization: `Bearer ${otherUserRes.token}` },
  })
  assert(13, 'Unauthorized lead access rejected', unauthAccessRes.status === 404, 'User B received HTTP 404 Not Found')

  // 14. Frontend AI Status Endpoint
  const aiStatusRes = await fetch(`${BASE_URL}/ai/status`).then((r) => r.json())
  assert(14, 'Frontend AI status endpoint', aiStatusRes.success === true && Boolean(aiStatusRes.status), `Status: "${aiStatusRes.status}"`)

  // 15. Existing Dashboard
  const dashRes = await fetch(`${BASE_URL}/dashboard`, { headers: authHeaders }).then((r) => r.json())
  assert(15, 'Existing Dashboard intact', dashRes.success === true && dashRes.metrics?.totalLeads >= 2, `Total leads: ${dashRes.metrics?.totalLeads}`)

  // 16. Existing Leads
  const allLeadsRes = await fetch(`${BASE_URL}/leads`, { headers: authHeaders }).then((r) => r.json())
  assert(16, 'Existing Leads module intact', allLeadsRes.success === true && allLeadsRes.leads.length >= 2, `Leads count: ${allLeadsRes.leads.length}`)

  // 17. Existing AI Agents
  const allAgentsRes = await fetch(`${BASE_URL}/agents`, { headers: authHeaders }).then((r) => r.json())
  assert(17, 'Existing AI Agents intact', allAgentsRes.success === true && allAgentsRes.agents.length === 3, '3 default MVP agents present')

  // 18. Existing Workflows
  const allWfsRes = await fetch(`${BASE_URL}/workflows`, { headers: authHeaders }).then((r) => r.json())
  assert(18, 'Existing Workflows module intact', allWfsRes.success === true && allWfsRes.workflows.length >= 1, `Workflows: ${allWfsRes.workflows.length}`)

  // 19. Existing Analytics
  const analyticsRes = await fetch(`${BASE_URL}/analytics?range=Today`, { headers: authHeaders }).then((r) => r.json())
  assert(19, 'Existing Analytics module intact', analyticsRes.success === true && analyticsRes.analytics?.kpis !== undefined, `Total leads KPI: ${analyticsRes.analytics?.kpis?.totalLeads}`)

  // 20. Existing Settings
  const profileRes = await fetch(`${BASE_URL}/profile`, { headers: authHeaders }).then((r) => r.json())
  assert(20, 'Existing Settings/Profile module intact', profileRes.success === true && profileRes.profile?.email === testUser.email, `Profile email: ${profileRes.profile?.email}`)

  console.log('\n==================================================================')
  console.log(`STEP 18 TOTAL PASSED: ${results.passed.length} / 20`)
  console.log(`STEP 18 TOTAL FAILED: ${results.failed.length} / 20`)
  console.log('==================================================================\n')

  return results
}

if (process.argv[1]?.endsWith('step18FullRegression.test.js')) {
  runStep18FullTests().then((res) => {
    if (res.failed.length > 0) {
      process.exit(1)
    }
  }).catch((err) => {
    console.error('Fatal test runner error:', err)
    process.exit(1)
  })
}
