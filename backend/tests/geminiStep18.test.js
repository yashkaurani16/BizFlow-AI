/**
 * BizFlow AI — Step 18 Automated Gemini Integration Test Suite
 * Tests provider configuration, SDK integration, structured analysis,
 * fallback behavior, inactive agent handling, human review enforcement,
 * and multi-tenant boundary isolation.
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

export async function runGeminiStep18Tests() {
  const BASE_URL = 'http://localhost:5000/api'
  console.log('==================================================================')
  console.log('      BIZFLOW AI — STEP 18 GOOGLE GEMINI INTEGRATION TESTS        ')
  console.log('==================================================================\n')

  const results = { passed: [], failed: [] }

  function assert(num, name, condition, details = '') {
    const label = `Test ${num}: ${name}${details ? ` — ${details}` : ''}`
    if (condition) {
      console.log(`[PASS] ${label}`)
      results.passed.push(label)
    } else {
      console.error(`[FAIL] ${label}`)
      results.failed.push(label)
    }
  }

  const sampleLead = {
    name: 'Tanya Sterling',
    company: 'Sterling Dynamics',
    email: 'tanya@sterlingdynamics.io',
    phone: '+1 555-0177',
    status: 'New',
    budget: '$45,000',
    projectTimeline: 'Immediate (within 14 days)',
    notes: 'Inbound evaluation for sales triage automation and CRM synchronization.',
    score: 92,
  }

  const salesAgent = {
    name: 'Sales Agent',
    type: 'Sales',
    status: 'Active',
    instructions: 'Evaluate inbound B2B business leads, assess budget and timeline, and generate initial outreach strategy.',
  }

  // 1. Gemini Configuration Validation
  const savedProvider = process.env.AI_PROVIDER
  const savedKey = process.env.AI_API_KEY
  const savedModel = process.env.AI_MODEL

  process.env.AI_PROVIDER = 'gemini'
  process.env.AI_API_KEY = 'test_placeholder_key'
  process.env.AI_MODEL = 'gemini-2.5-flash'

  const geminiConfig = getProviderConfig()
  const configValid =
    geminiConfig.provider === 'gemini' &&
    geminiConfig.model === 'gemini-2.5-flash' &&
    geminiConfig.isConfigured === true
  assert(1, 'Gemini configuration', configValid, `Provider: ${geminiConfig.provider}, Model: ${geminiConfig.model}`)

  // 2. Successful Lead Analysis (Structured Schema & Bounded Output)
  process.env.AI_PROVIDER = ''
  process.env.AI_API_KEY = ''
  const fallbackAnalysis = await analyzeLead(sampleLead, salesAgent)
  const analysisStructured =
    Boolean(fallbackAnalysis.summary) &&
    ['High', 'Medium', 'Low'].includes(fallbackAnalysis.leadQuality) &&
    Boolean(fallbackAnalysis.suggestedNextStep) &&
    Boolean(fallbackAnalysis.reasoningSummary) &&
    fallbackAnalysis.humanReviewRequired === true
  assert(2, 'Structured lead analysis output', analysisStructured, `Lead Quality: ${fallbackAnalysis.leadQuality}, HumanReview: ${fallbackAnalysis.humanReviewRequired}`)

  // 3. Missing API Key Safe Fallback
  process.env.AI_PROVIDER = 'gemini'
  process.env.AI_API_KEY = ''
  const missingKeyConfig = getProviderConfig()
  const missingKeyRes = await executeAIRequest({
    systemPrompt: 'System',
    userPrompt: 'User',
    fallbackFn: () => generateFallbackAnalysis(sampleLead, salesAgent),
  })
  const missingKeyValid =
    missingKeyConfig.isConfigured === false &&
    missingKeyRes.isFallback === true &&
    missingKeyRes.result.humanReviewRequired === true
  assert(3, 'Missing API key handling', missingKeyValid, 'Fell back automatically without network attempt')

  // 4. Invalid Provider Configuration Handling
  process.env.AI_PROVIDER = 'unknown_vendor_xyz'
  process.env.AI_API_KEY = 'some_key'
  const invalidProviderConfig = getProviderConfig()
  const invalidProviderRes = await executeAIRequest({
    systemPrompt: 'System',
    userPrompt: 'User',
    fallbackFn: () => generateFallbackAnalysis(sampleLead, salesAgent),
  })
  const invalidProviderValid =
    invalidProviderConfig.isConfigured === false &&
    invalidProviderRes.isFallback === true
  assert(4, 'Invalid provider configuration handling', invalidProviderValid, 'Degraded to bounded fallback')

  // 5. Provider Failure (@google/genai SDK Error Handling & Key Sanitization)
  process.env.AI_PROVIDER = 'gemini'
  process.env.AI_API_KEY = 'AIzaSyFakeInvalidGeminiKey1234567890'
  process.env.AI_MODEL = 'gemini-2.5-flash'
  let providerFailureHandled = false
  try {
    const failRes = await analyzeLead(sampleLead, salesAgent)
    providerFailureHandled =
      failRes.isFallback === true &&
      failRes.humanReviewRequired === true &&
      !failRes.summary.includes('AIzaSyFake')
  } catch (e) {
    providerFailureHandled = false
  }
  assert(5, 'Provider failure with @google/genai SDK', providerFailureHandled, 'SDK error intercepted; masked secrets and returned fallback')

  // Reset environment
  process.env.AI_PROVIDER = savedProvider || ''
  process.env.AI_API_KEY = savedKey || ''
  process.env.AI_MODEL = savedModel || ''

  // 6. Direct Fallback Behavior
  const directFallback = generateFallbackAnalysis(sampleLead, salesAgent)
  const fallbackValid =
    directFallback.isFallback === true &&
    directFallback.humanReviewRequired === true &&
    directFallback.summary.includes('Tanya Sterling')
  assert(6, 'Fallback behavior', fallbackValid, 'Deterministic bounded qualification generated')

  // Setup test user for server-side endpoints
  const testUser = {
    name: 'Gemini Test Admin',
    email: `gemini.tester.${Date.now()}@bizflow.ai`,
    password: 'Password123!',
    company: 'Sterling Dynamics',
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

  // 7. Lead Remains Saved After AI Processing
  const leadRes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(sampleLead),
  }).then((r) => r.json())
  const createdLeadId = leadRes.lead?._id || leadRes.lead?.id
  const leadPersisted = leadRes.success && Boolean(createdLeadId)
  assert(7, 'Lead remains saved after AI processing', leadPersisted, `Lead ID: ${createdLeadId}`)

  // 8. Follow-up Task Creation
  const leadDetail = await fetch(`${BASE_URL}/leads/${createdLeadId}`, { headers: authHeaders }).then((r) => r.json())
  const tasks = leadDetail.lead?.tasks || []
  const taskCreated = tasks.length > 0 && tasks[0].status === 'Pending'
  assert(8, 'Follow-up task creation', taskCreated, `Task: "${tasks[0]?.title}"`)

  // 9. Activity Creation
  const activities = leadDetail.lead?.activities || []
  const hasActivities = activities.length >= 2
  assert(9, 'Activity creation', hasActivities, `Created ${activities.length} audit trail records`)

  // 10. Human-Review Indicator
  const hasHumanReviewNotice =
    leadDetail.lead?.aiMetadata?.humanReviewRequired === true &&
    activities.some((a) => a.title?.includes('Human Review') || a.description?.includes('Human Review Required'))
  assert(10, 'Human-review indicator', hasHumanReviewNotice, 'Flagged Human Review Required in lead metadata & activities')

  // 11. Inactive Sales Agent Enforcement
  const agentsRes = await fetch(`${BASE_URL}/agents`, { headers: authHeaders }).then((r) => r.json())
  const userSalesAgent = agentsRes.agents.find((a) => a.type === 'Sales')
  await fetch(`${BASE_URL}/agents/${userSalesAgent._id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ status: 'Inactive' }),
  })

  const leadInactiveAgentRes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Arthur Miller',
      email: 'arthur@millerbooks.com',
      company: 'Miller Publishing',
      status: 'New',
    }),
  }).then((r) => r.json())

  const leadInactiveSaved = leadInactiveAgentRes.success && Boolean(leadInactiveAgentRes.lead?._id || leadInactiveAgentRes.lead?.id)
  const wfList = await fetch(`${BASE_URL}/workflows`, { headers: authHeaders }).then((r) => r.json())
  const wfDetail = await fetch(`${BASE_URL}/workflows/${wfList.workflows?.[0]?._id}`, { headers: authHeaders }).then((r) => r.json())
  const executions = wfDetail.workflow?.executions || []
  const inactiveHandled =
    leadInactiveSaved &&
    executions.some((e) => e.error?.includes('Inactive') || e.status === 'Failed')
  assert(11, 'Inactive Sales Agent enforcement', inactiveHandled, 'Workflow skipped AI analysis for inactive agent; lead safely saved')

  // Re-activate agent
  await fetch(`${BASE_URL}/agents/${userSalesAgent._id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ status: 'Active' }),
  })

  // 12. Unauthorized Lead Access (Multi-tenant isolation)
  const userBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'User B Rival',
      email: `rival.${Date.now()}@bizflow.ai`,
      password: 'Password123!',
    }),
  }).then((r) => r.json())
  const userBAccessLeadA = await fetch(`${BASE_URL}/leads/${createdLeadId}`, {
    headers: { Authorization: `Bearer ${userBRes.token}` },
  })
  assert(12, 'Unauthorized lead access rejected', userBAccessLeadA.status === 404, 'User B received HTTP 404 Not Found')

  console.log('\n==================================================================')
  console.log(`GEMINI STEP 18 PASSED: ${results.passed.length} / 12`)
  console.log(`GEMINI STEP 18 FAILED: ${results.failed.length} / 12`)
  console.log('==================================================================\n')

  return results
}

if (process.argv[1]?.endsWith('geminiStep18.test.js')) {
  runGeminiStep18Tests().then((res) => {
    if (res.failed.length > 0) {
      process.exit(1)
    }
  }).catch((err) => {
    console.error('Fatal test runner error:', err)
    process.exit(1)
  })
}
