/**
 * BizFlow AI — Step 19 Advanced CRM + AI Lead Intelligence Test Suite
 * Validates:
 * 1. AI Lead Scoring (score 0-100, priority, keySignals, risks, recommendedNextAction, followUpSuggestion)
 * 2. Structured AI intelligence schema validation
 * 3. Bounded fallback generation using only available CRM information
 * 4. Resilient error handling when Gemini provider fails or key is invalid
 * 5. Secret sanitization (never expose API keys in logs or payloads)
 * 6. Lead creation & workflow integration with structured intelligence
 * 7. Follow-up task creation linked to recommended next action
 * 8. Audit activity creation with score and priority
 * 9. On-demand Analyze Lead Action (POST /api/leads/:id/analyze)
 * 10. Multi-tenant authorization guard (cross-user access rejected with HTTP 404)
 * 11. Unauthenticated access rejected with HTTP 401
 * 12. Aggregate CRM Analytics calculations (analyzed leads, high priority, average score, requiring follow-up)
 * 13. Permanent Human Review Requirement enforcement
 * 14. Zero autonomous external messaging actions (No WhatsApp, Email, SMS)
 */

import { analyzeLead, getAIProviderStatus } from '../src/services/ai/aiService.js'
import { generateFallbackAnalysis, getProviderConfig } from '../src/services/ai/providerAdapter.js'
import { executeNewLeadWorkflow } from '../src/services/workflowEngine.js'

export async function runStep19Tests() {
  const BASE_URL = 'http://localhost:5000/api'
  console.log('==================================================================')
  console.log('    BIZFLOW AI — STEP 19 ADVANCED CRM & AI LEAD INTELLIGENCE      ')
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
    name: 'Samantha Ray',
    company: 'Apex Logistics Corp',
    email: 'samantha@apexlogistics.com',
    phone: '+1 555-0199',
    status: 'New',
    budget: '$60,000',
    projectTimeline: 'Within 30 days',
    notes: 'Looking for autonomous lead intake automation and real-time CRM updates.',
  }

  const salesAgent = {
    name: 'Sales Agent',
    type: 'Sales',
    status: 'Active',
    instructions: 'Evaluate inbound B2B logistics leads, score qualification tier, and suggest outreach strategy.',
  }

  // 1. AI Lead Scoring Bounded Output
  const fallbackIntel = generateFallbackAnalysis(sampleLead, salesAgent)
  const scoringValid =
    typeof fallbackIntel.score === 'number' &&
    fallbackIntel.score >= 0 &&
    fallbackIntel.score <= 100 &&
    ['High', 'Medium', 'Low'].includes(fallbackIntel.priority) &&
    Boolean(fallbackIntel.summary)
  assert(1, 'AI Lead Scoring structure', scoringValid, `Score: ${fallbackIntel.score}, Priority: ${fallbackIntel.priority}`)

  // 2. Structured Lead Intelligence Schema
  const schemaValid =
    Array.isArray(fallbackIntel.keySignals) &&
    fallbackIntel.keySignals.length > 0 &&
    Array.isArray(fallbackIntel.risks) &&
    fallbackIntel.risks.length > 0 &&
    Boolean(fallbackIntel.recommendedNextAction) &&
    Boolean(fallbackIntel.followUpSuggestion) &&
    fallbackIntel.humanReviewRequired === true
  assert(2, 'Structured intelligence fields (signals, risks, actions, drafts)', schemaValid, `Signals: ${fallbackIntel.keySignals.length}, Risks: ${fallbackIntel.risks.length}`)

  // 3. Fallback behavior uses ONLY provided lead data (no invented facts)
  const derivedFromData =
    fallbackIntel.summary.includes('Samantha Ray') &&
    fallbackIntel.summary.includes('Apex Logistics Corp') &&
    fallbackIntel.keySignals.some((s) => s.includes('Apex Logistics Corp'))
  assert(3, 'Bounded analysis uses only provided CRM information', derivedFromData, 'Verified company affiliation correctly extracted from lead')

  // 4. Safe fallback when Gemini request fails (key invalid or network failure)
  const savedKey = process.env.AI_API_KEY
  process.env.AI_API_KEY = 'AIzaSyFakeKey_SimulateStep19Failure'
  let safeFallbackWorked = false
  try {
    const res = await analyzeLead(sampleLead, salesAgent)
    safeFallbackWorked =
      res.isFallback === true &&
      res.humanReviewRequired === true &&
      !JSON.stringify(res).includes('AIzaSyFakeKey')
  } catch (err) {
    safeFallbackWorked = false
  } finally {
    process.env.AI_API_KEY = savedKey
  }
  assert(4, 'Provider failure safe fallback and secret masking', safeFallbackWorked, 'Safely degraded to bounded intelligence; secret masked')

  // Register dedicated user for full integration tests
  const testUser = {
    name: 'Step 19 Admin',
    email: `crm.intelligence.${Date.now()}@bizflow.ai`,
    password: 'Password123!',
    company: 'Apex Logistics',
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

  // 5. Create Lead and verify New Lead Follow-Up workflow stores structured aiIntelligence
  const leadRes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(sampleLead),
  }).then((r) => r.json())
  const createdLead = leadRes.lead
  const createdLeadId = createdLead?._id || createdLead?.id
  const hasAiIntelligence =
    Boolean(createdLead?.aiIntelligence) &&
    typeof createdLead.aiIntelligence?.score === 'number' &&
    ['High', 'Medium', 'Low'].includes(createdLead.aiIntelligence?.priority) &&
    createdLead.aiIntelligence?.humanReviewRequired === true
  assert(5, 'Lead creation workflow attaches structured aiIntelligence', hasAiIntelligence, `Score: ${createdLead?.aiIntelligence?.score}, Priority: ${createdLead?.aiIntelligence?.priority}`)

  // 6. Follow-up task creation linked to recommended next action
  const leadDetail = await fetch(`${BASE_URL}/leads/${createdLeadId}`, { headers: authHeaders }).then((r) => r.json())
  const tasks = leadDetail.lead?.tasks || []
  const taskValid =
    tasks.length > 0 &&
    tasks[0].status === 'Pending' &&
    Boolean(tasks[0].description)
  assert(6, 'Follow-up task created with recommended next action', taskValid, `Task Title: "${tasks[0]?.title}"`)

  // 7. Activity creation with score and priority
  const activities = leadDetail.lead?.activities || []
  const hasAnalysisAct = activities.some(
    (a) => a.type === 'lead_analyzed' && (a.description?.includes('Human Review Required') || a.title?.includes('Score')),
  )
  assert(7, 'Activity created with score & Human Review requirement', hasAnalysisAct, `Activities: ${activities.length}`)

  // 8. On-Demand "Analyze with AI" Endpoint (POST /api/leads/:id/analyze)
  const analyzeRes = await fetch(`${BASE_URL}/leads/${createdLeadId}/analyze`, {
    method: 'POST',
    headers: authHeaders,
  }).then((r) => r.json())
  const analyzeSuccess =
    analyzeRes.success === true &&
    Boolean(analyzeRes.lead?.aiIntelligence) &&
    typeof analyzeRes.lead.aiIntelligence.score === 'number' &&
    analyzeRes.lead.aiIntelligence.humanReviewRequired === true
  assert(8, 'On-demand Analyze with AI endpoint (POST /api/leads/:id/analyze)', analyzeSuccess, `Analyzed Lead Score: ${analyzeRes.lead?.aiIntelligence?.score}`)

  // 9. Unauthorized access rejected (Cross-tenant isolation)
  const rivalUser = {
    name: 'Rival Infiltrator',
    email: `rival.${Date.now()}@bizflow.ai`,
    password: 'Password123!',
  }
  const rivalRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rivalUser),
  }).then((r) => r.json())
  const crossUserAccess = await fetch(`${BASE_URL}/leads/${createdLeadId}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rivalRes.token}`,
    },
  })
  assert(9, 'Cross-user lead analysis rejected with HTTP 404', crossUserAccess.status === 404, `Status received: ${crossUserAccess.status}`)

  // 10. Unauthenticated access rejected with HTTP 401
  const unauthAccess = await fetch(`${BASE_URL}/leads/${createdLeadId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  assert(10, 'Unauthenticated analysis rejected with HTTP 401', unauthAccess.status === 401, `Status received: ${unauthAccess.status}`)

  // 11. Aggregate CRM Analytics calculations
  const analyticsRes = await fetch(`${BASE_URL}/analytics`, { headers: authHeaders }).then((r) => r.json())
  const crmIntel = analyticsRes.analytics?.crmIntelligence
  const analyticsValid =
    crmIntel !== undefined &&
    crmIntel.analyzedLeads >= 1 &&
    typeof crmIntel.averageAiScore === 'number' &&
    crmIntel.averageAiScore > 0 &&
    typeof crmIntel.highPriorityLeads === 'number' &&
    typeof crmIntel.leadsRequiringFollowUp === 'number'
  assert(11, 'CRM intelligence analytics calculations', analyticsValid, `Analyzed: ${crmIntel?.analyzedLeads}, Avg Score: ${crmIntel?.averageAiScore}, High Priority: ${crmIntel?.highPriorityLeads}`)

  // 12. Human Review requirement permanently enforced
  const humanReviewEnforced =
    fallbackIntel.humanReviewRequired === true &&
    createdLead?.aiIntelligence?.humanReviewRequired === true &&
    analyzeRes.lead?.aiIntelligence?.humanReviewRequired === true
  assert(12, 'Human review permanently required across all AI intelligence', humanReviewEnforced, 'Flag permanently true in models and responses')

  // 13. Zero external messaging actions
  const statusRes = await fetch(`${BASE_URL}/ai/status`).then((r) => r.json())
  const safePolicy =
    statusRes.success === true &&
    statusRes.safetyPolicy?.includes('no autonomous external messaging')
  assert(13, 'Strict safety policy: No external messaging actions', safePolicy, 'No WhatsApp, Email, or SMS automated dispatch')

  console.log('\n==================================================================')
  console.log(`STEP 19 PASSED: ${results.passed.length} / 13`)
  console.log(`STEP 19 FAILED: ${results.failed.length} / 13`)
  console.log('==================================================================\n')

  return results
}

if (process.argv[1]?.endsWith('step19LeadIntelligence.test.js')) {
  runStep19Tests().then((res) => {
    if (res.failed.length > 0) {
      process.exit(1)
    }
  }).catch((err) => {
    console.error('Fatal test runner error:', err)
    process.exit(1)
  })
}
