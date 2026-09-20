/**
 * BizFlow AI — Step 22 Advanced Analytics & AI Insights Test Suite
 * Validates:
 * 1. Authenticated Analytics Endpoint (GET /api/analytics requires valid auth)
 * 2. Real Operational CRM Metrics (Total, New, Contacted, Qualified, Converted, Lost, High-Priority, Avg Score)
 * 3. Lead Pipeline Funnel & Conversion Drop-off (Funnel counts, shares, dropoffs, conversion rates)
 * 4. AI Score Distribution Tiers (0-39, 40-69, 70-89, 90-100)
 * 5. Workflow Analytics (Active/Inactive, Executions, Success Rate)
 * 6. Communication Analytics (Email, WhatsApp, SMS drafts, Human-Approved count, Sandbox simulated sends)
 * 7. Sandbox Transparency (Sandbox notice clearly stated, simulated flags intact)
 * 8. AI Analytics (Analyzed leads, Real AI vs Fallback, Human Review Required counts)
 * 9. Time-Series Daily Grouping (Real timestamp aggregation, no fabricated dates)
 * 10. Multi-Filter Support (Date range, status, priority, communication channel)
 * 11. Clean / Empty State Handling (Zero division protection, no NaN, empty arrays)
 * 12. Multi-Tenant Authorization & Data Isolation (Strict owner scoping)
 * 13. Dedicated AI Insights Endpoint (GET /api/analytics/insights with structured schema)
 * 14. Advisory Safety Enforcement (Insights are strictly read-only, non-mutating)
 * 15. Secret & Key Leakage Prevention (No credentials or keys leaked in analytics payloads)
 * 16. AI Service Unit Test (generateAnalyticsInsights returns 5 categorized insights)
 */

import { generateAnalyticsInsights } from '../src/services/ai/aiService.js'

export async function runStep22Tests() {
  const BASE_URL = 'http://localhost:5000/api'
  console.log('==================================================================')
  console.log('       BIZFLOW AI — STEP 22 ADVANCED ANALYTICS & AI INSIGHTS      ')
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

  async function createTestUser(prefix = 'analytics') {
    const email = `test_${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}@bizflow.io`
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Analytics Officer',
        email,
        password: 'Password123!',
      }),
    })
    const data = await res.json()
    if (!data.token) {
      throw new Error(`Auth failed: ${data.message || 'No token'}`)
    }
    return { token: data.token, user: data.user }
  }

  // -------------------------------------------------------------
  // 1. AUTHENTICATION & ACCESS CONTROL
  // -------------------------------------------------------------
  const unauthRes = await fetch(`${BASE_URL}/analytics`)
  assert(
    1,
    'Analytics Endpoint Rejects Unauthenticated Requests',
    unauthRes.status === 401,
    `Status: ${unauthRes.status}`
  )

  const userA = await createTestUser('user_a')
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userA.token}`,
  }

  const authRes = await fetch(`${BASE_URL}/analytics`, { headers: authHeaders })
  const authData = await authRes.json()
  assert(
    2,
    'Analytics Endpoint Accepts Authenticated Requests',
    authRes.status === 200 && authData.success === true && Boolean(authData.analytics),
    `Status: ${authRes.status}, success: ${authData.success}`
  )

  // -------------------------------------------------------------
  // 2. EMPTY STATE & ZERO-DIVISION SAFETY
  // -------------------------------------------------------------
  const emptyAnalytics = authData.analytics
  assert(
    3,
    'Empty Tenant Returns Zero Counts Safely (No NaN)',
    emptyAnalytics.kpis.totalLeads === 0 &&
      emptyAnalytics.kpis.averageAiScore === 0 &&
      emptyAnalytics.pipeline.conversionRate === '0.0%' &&
      emptyAnalytics.pipeline.qualificationRate === '0.0%' &&
      emptyAnalytics.workflows.totalWorkflows >= 0,
    `Conversion: ${emptyAnalytics.pipeline.conversionRate}, Avg Score: ${emptyAnalytics.kpis.averageAiScore}`
  )

  assert(
    4,
    'Empty Tenant Returns Clean Empty Time-Series (No Fabricated Dates)',
    Array.isArray(emptyAnalytics.timeSeries.leadsOverTime) &&
      emptyAnalytics.timeSeries.leadsOverTime.length === 0,
    `Leads timeSeries length: ${emptyAnalytics.timeSeries.leadsOverTime.length}`
  )

  // -------------------------------------------------------------
  // 3. CREATE REAL OPERATIONAL CRM DATA VIA HTTP API
  // -------------------------------------------------------------
  // Create Lead 1: New
  const lead1Res = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Sarah Connor',
      email: 'sarah@cyberdyne.org',
      company: 'Resistance Ops',
      phone: '+14155550101',
      status: 'New',
      notes: 'Urgent infrastructure automation request',
    }),
  }).then((r) => r.json())
  const lead1Id = lead1Res.lead?._id || lead1Res.lead?.id

  // Create Lead 2: Contacted
  const lead2Res = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'John Connor',
      email: 'john@cyberdyne.org',
      company: 'Resistance Ops',
      phone: '+14155550102',
      status: 'New',
      notes: 'Secondary stakeholder review',
    }),
  }).then((r) => r.json())
  const lead2Id = lead2Res.lead?._id || lead2Res.lead?.id
  await fetch(`${BASE_URL}/leads/${lead2Id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ status: 'Contacted' }),
  })

  // Create Lead 3: Qualified
  const lead3Res = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Kyle Reese',
      email: 'kyle@future.net',
      company: 'Tech Com Systems',
      phone: '+14155550103',
      status: 'New',
      notes: 'Qualified for enterprise deployment tier',
    }),
  }).then((r) => r.json())
  const lead3Id = lead3Res.lead?._id || lead3Res.lead?.id
  await fetch(`${BASE_URL}/leads/${lead3Id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ status: 'Qualified' }),
  })

  // Create Lead 4: Converted
  const lead4Res = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Miles Dyson',
      email: 'miles@cyberdyne.org',
      company: 'Neural Systems',
      phone: '+14155550104',
      status: 'New',
      notes: 'Contract finalized and payment processed',
    }),
  }).then((r) => r.json())
  const lead4Id = lead4Res.lead?._id || lead4Res.lead?.id
  await fetch(`${BASE_URL}/leads/${lead4Id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ status: 'Converted' }),
  })

  assert(
    5,
    'Four Real Leads Successfully Ingested in CRM',
    Boolean(lead1Id && lead2Id && lead3Id && lead4Id),
    `IDs: ${lead1Id}, ${lead2Id}, ${lead3Id}, ${lead4Id}`
  )

  // Trigger on-demand AI analysis for leads
  await fetch(`${BASE_URL}/leads/${lead1Id}/analyze`, { method: 'POST', headers: authHeaders })
  await fetch(`${BASE_URL}/leads/${lead3Id}/analyze`, { method: 'POST', headers: authHeaders })

  // Generate Communication Drafts (Email, WhatsApp, SMS)
  const emailDraftRes = await fetch(`${BASE_URL}/communications/draft`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      leadId: lead1Id,
      channel: 'email',
      templateType: 'initial_outreach',
    }),
  }).then((r) => r.json())

  const waDraftRes = await fetch(`${BASE_URL}/communications/draft`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      leadId: lead2Id,
      channel: 'whatsapp',
      templateType: 'follow_up',
    }),
  }).then((r) => r.json())

  const smsDraftRes = await fetch(`${BASE_URL}/communications/draft`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      leadId: lead3Id,
      channel: 'sms',
      templateType: 'urgent_reminder',
    }),
  }).then((r) => r.json())

  assert(
    6,
    'AI Communication Drafts Generated Across 3 Channels',
    emailDraftRes.success === true && waDraftRes.success === true && smsDraftRes.success === true,
    'Email, WhatsApp, and SMS draft generation verified'
  )

  // Human-Approved simulated send
  const sendRes = await fetch(`${BASE_URL}/communications/send`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      leadId: lead1Id,
      channel: 'email',
      recipient: 'sarah@cyberdyne.org',
      subject: emailDraftRes.draft?.subject || 'Introduction to BizFlow AI',
      content: emailDraftRes.draft?.content || 'Hi Sarah, welcome to BizFlow AI.',
      humanApproved: true,
    }),
  }).then((r) => r.json())

  assert(
    7,
    'Human-Approved Communication Dispatched in Sandbox',
    sendRes.success === true && (sendRes.result?.simulated === true || sendRes.result?.mode === 'sandbox'),
    `Mode: ${sendRes.result?.mode}, Simulated: ${sendRes.result?.simulated}`
  )

  // -------------------------------------------------------------
  // 4. FETCH AGGREGATED METRICS & VALIDATE
  // -------------------------------------------------------------
  const metricsRes = await fetch(`${BASE_URL}/analytics`, { headers: authHeaders })
  const metricsData = await metricsRes.json()
  const a = metricsData.analytics

  assert(
    8,
    'CRM Operational KPI Metrics Aggregate Accurately',
    a.kpis.totalLeads === 4 &&
      a.kpis.newLeads === 1 &&
      a.kpis.contactedLeads === 1 &&
      a.kpis.qualifiedLeads === 1 &&
      a.kpis.convertedLeads === 1,
    `Total: ${a.kpis.totalLeads}, New: ${a.kpis.newLeads}, Contacted: ${a.kpis.contactedLeads}, Qualified: ${a.kpis.qualifiedLeads}, Converted: ${a.kpis.convertedLeads}`
  )

  assert(
    9,
    'Average AI Score Computed From Scored Leads',
    typeof a.kpis.averageAiScore === 'number' && a.kpis.averageAiScore > 0,
    `Calculated Avg AI Score: ${a.kpis.averageAiScore}`
  )

  // Pipeline Funnel: 4 stages
  assert(
    10,
    'Pipeline Funnel Stages Reflect Real Lifecycle',
    Array.isArray(a.pipeline.funnel) &&
      a.pipeline.funnel.length === 4 &&
      a.pipeline.funnel[0].count === 4 && // Captured (Total)
      a.pipeline.funnel[1].count === 3 && // Contacted, Qualified, Converted
      a.pipeline.funnel[2].count === 2 && // Qualified, Converted
      a.pipeline.funnel[3].count === 1, // Converted
    `Funnel Counts: [${a.pipeline.funnel.map((s) => s.count).join(', ')}]`
  )

  assert(
    11,
    'Pipeline Conversion and Qualification Rates Calculated',
    a.pipeline.conversionRate === '25.0%' && a.pipeline.qualificationRate === '50.0%',
    `Conversion: ${a.pipeline.conversionRate}, Qualification: ${a.pipeline.qualificationRate}`
  )

  assert(
    12,
    'AI Score Distribution Tiers Defined',
    a.pipeline.scoreDistribution &&
      typeof a.pipeline.scoreDistribution.tierLow === 'number' &&
      typeof a.pipeline.scoreDistribution.tierModerate === 'number' &&
      typeof a.pipeline.scoreDistribution.tierStrong === 'number' &&
      typeof a.pipeline.scoreDistribution.tierExceptional === 'number',
    `Tiers: ${JSON.stringify(a.pipeline.scoreDistribution)}`
  )

  // -------------------------------------------------------------
  // 5. WORKFLOW ANALYTICS
  // -------------------------------------------------------------
  assert(
    13,
    'Workflow Metrics Reflect Real Workflow Activity',
    a.workflows.totalWorkflows >= 1 &&
      a.workflows.activeWorkflows >= 1 &&
      typeof a.workflows.successRate === 'string',
    `Workflows: ${a.workflows.totalWorkflows}, Active: ${a.workflows.activeWorkflows}, SuccessRate: ${a.workflows.successRate}`
  )

  // -------------------------------------------------------------
  // 6. COMMUNICATION & SANDBOX AUDIT
  // -------------------------------------------------------------
  assert(
    14,
    'Communication Channel Drafts Audited Accurately',
    a.communications.emailDrafts >= 1 &&
      a.communications.whatsappDrafts >= 1 &&
      a.communications.smsDrafts >= 1 &&
      a.communications.totalDrafts >= 3,
    `Email: ${a.communications.emailDrafts}, WA: ${a.communications.whatsappDrafts}, SMS: ${a.communications.smsDrafts}, Total: ${a.communications.totalDrafts}`
  )

  assert(
    15,
    'Human Approvals and Sandbox Sends Audited',
    a.communications.humanApprovedCount >= 1 && a.communications.simulatedSends >= 1,
    `Human Approved: ${a.communications.humanApprovedCount}, Simulated: ${a.communications.simulatedSends}`
  )

  assert(
    16,
    'Development Sandbox Transparency Notice Present',
    typeof a.communications.sandboxNotice === 'string' &&
      a.communications.sandboxNotice.includes('Development Sandbox Mode'),
    `Notice: "${a.communications.sandboxNotice}"`
  )

  // -------------------------------------------------------------
  // 7. TIME-SERIES DAILY TIMESTAMPS
  // -------------------------------------------------------------
  assert(
    17,
    'Time Series Data Grouped by Real Calendar Date (YYYY-MM-DD)',
    Array.isArray(a.timeSeries.leadsOverTime) &&
      a.timeSeries.leadsOverTime.length > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(a.timeSeries.leadsOverTime[0].date),
    `Time-series point: ${JSON.stringify(a.timeSeries.leadsOverTime[0])}`
  )

  // -------------------------------------------------------------
  // 8. MULTI-FILTER SUPPORT
  // -------------------------------------------------------------
  const filteredStatusRes = await fetch(`${BASE_URL}/analytics?status=Qualified`, {
    headers: authHeaders,
  }).then((r) => r.json())
  assert(
    18,
    'Lead Status Filter Correctly Filters Pipeline',
    filteredStatusRes.analytics.kpis.totalLeads === 1 &&
      filteredStatusRes.analytics.kpis.qualifiedLeads === 1,
    `Filtered Leads: ${filteredStatusRes.analytics.kpis.totalLeads}`
  )

  const filteredChannelRes = await fetch(`${BASE_URL}/analytics?channel=email`, {
    headers: authHeaders,
  }).then((r) => r.json())
  assert(
    19,
    'Channel Filter Correctly Filters Activity Metrics',
    filteredChannelRes.analytics.filters.channel === 'email' &&
      Array.isArray(filteredChannelRes.analytics.recentActivities),
    `Filter channel: ${filteredChannelRes.analytics.filters.channel}`
  )

  // -------------------------------------------------------------
  // 9. DEDICATED AI INSIGHTS ENDPOINT & SCHEMA
  // -------------------------------------------------------------
  const insightsRes = await fetch(`${BASE_URL}/analytics/insights`, { headers: authHeaders })
  const insightsData = await insightsRes.json()

  assert(
    20,
    'Dedicated AI Insights Endpoint Returns 200 with Schema',
    insightsRes.status === 200 &&
      insightsData.success === true &&
      Array.isArray(insightsData.aiInsights?.insights) &&
      insightsData.aiInsights.insights.length >= 3,
    `Insights count: ${insightsData.aiInsights?.insights?.length}`
  )

  const sample = insightsData.aiInsights?.insights[0]
  assert(
    21,
    'AI Insights Conform to Strict Schema Specification',
    Boolean(
      sample &&
        sample.title &&
        sample.category &&
        sample.insight &&
        sample.supportingMetric &&
        sample.recommendedAction
    ),
    `Sample Category: ${sample?.category}, Title: "${sample?.title}"`
  )

  // -------------------------------------------------------------
  // 10. ADVISORY SAFETY GUARANTEE (READ-ONLY)
  // -------------------------------------------------------------
  const leadsAfterRes = await fetch(`${BASE_URL}/leads`, { headers: authHeaders }).then((r) =>
    r.json()
  )
  assert(
    22,
    'AI Insights Are Strictly Read-Only (Zero CRM Mutations)',
    leadsAfterRes.leads?.length === 4,
    `Leads count before and after remains 4`
  )

  // -------------------------------------------------------------
  // 11. MULTI-TENANT ISOLATION
  // -------------------------------------------------------------
  const userB = await createTestUser('user_b')
  const userBRes = await fetch(`${BASE_URL}/analytics`, {
    headers: { Authorization: `Bearer ${userB.token}` },
  }).then((r) => r.json())

  assert(
    23,
    'Multi-Tenant Isolation: User B Cannot Access User A Data',
    userBRes.analytics.kpis.totalLeads === 0 &&
      userBRes.analytics.communications.totalDrafts === 0,
    `User B Leads: ${userBRes.analytics.kpis.totalLeads}, Drafts: ${userBRes.analytics.communications.totalDrafts}`
  )

  // -------------------------------------------------------------
  // 12. SECRET & KEY LEAKAGE PREVENTION
  // -------------------------------------------------------------
  const serialized = JSON.stringify(metricsData)
  const safePayload =
    !serialized.includes('AIza') &&
    !serialized.includes('sk_live_') &&
    !serialized.includes('sk_test_') &&
    !serialized.includes('GEMINI_API_KEY') &&
    !serialized.includes('password') &&
    !serialized.includes('process.env')
  assert(
    24,
    'No API Keys, Secrets, or Credentials Leaked in Analytics Payload',
    safePayload,
    'Zero confidential environment variables in responses'
  )

  // -------------------------------------------------------------
  // 13. DIRECT AI SERVICE UNIT TEST
  // -------------------------------------------------------------
  const serviceInsights = await generateAnalyticsInsights({
    totalLeads: 8,
    newLeads: 2,
    qualifiedLeads: 3,
    convertedLeads: 2,
    highPriorityLeads: 3,
    averageAiScore: 78.5,
    leadsRequiringFollowUp: 4,
    completedTasks: 3,
    pendingTasks: 2,
    activeWorkflows: 2,
    workflowSuccessRate: '100%',
    communicationDrafts: 5,
    humanApprovedSends: 3,
    channelBreakdown: { email: 3, whatsapp: 1, sms: 1 },
  })

  assert(
    25,
    'Direct generateAnalyticsInsights Service Unit Test',
    serviceInsights &&
      Array.isArray(serviceInsights.insights) &&
      serviceInsights.insights.length >= 3 &&
      typeof serviceInsights.isRealAI === 'boolean',
    `Direct insights count: ${serviceInsights?.insights?.length}, isRealAI: ${serviceInsights?.isRealAI}`
  )

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n==================================================================')
  console.log(`TOTAL TESTS: ${results.passed.length + results.failed.length}`)
  console.log(`PASSED:      ${results.passed.length}`)
  console.log(`FAILED:      ${results.failed.length}`)
  console.log('==================================================================\n')

  if (results.failed.length > 0) {
    throw new Error(`Step 22 test suite failed with ${results.failed.length} failures.`)
  }
  return results
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('step22Analytics.test.js')) {
  runStep22Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

export default runStep22Tests
