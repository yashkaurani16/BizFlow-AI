/**
 * BizFlow AI — Step 23 Security & Production Hardening Test Suite
 * Validates:
 * 1. Authentication Enforcement across private API routes
 * 2. Invalid, expired, and malformed JWT rejection (HTTP 401)
 * 3. Cross-tenant authorization guards for Leads, Workflows, Communications, and Analytics (HTTP 404/403)
 * 4. MongoDB ObjectId validation (rejects malformed IDs with HTTP 400, prevents CastError disclosure)
 * 5. NoSQL operator injection sanitization (rejects query/body keys starting with '$' or '.')
 * 6. Request payload size limit enforcement (> 1MB returns HTTP 413)
 * 7. Malformed JSON syntax error handling (returns HTTP 400 without crashing)
 * 8. Defense-in-depth security response headers (X-Content-Type-Options, X-Frame-Options, HSTS, CSP)
 * 9. Framework disclosure disabled (X-Powered-By header absent)
 * 10. CORS allowlist enforcement & unauthorized origin rejection
 * 11. Rate limiting on sensitive endpoints (HTTP 429 when threshold exceeded)
 * 12. Safe error responses (Zero stack traces or internal implementation details leaked)
 * 13. Safe logout handling (Stateless session acknowledgment)
 * 14. Mandatory human approval enforcement for communications
 * 15. Communication sandbox simulation guarantee
 * 16. AI advisory safety (Read-only insights, zero CRM mutations)
 * 17. Workflow builder communication approval guard
 * 18. Secret sanitization across all payloads (No API keys, secrets, or env vars)
 * 19. User profile sanitization (passwordHash never exposed)
 * 20. Strict recipient format validation for external communications
 */

import { resetRateLimits } from '../src/middleware/rateLimiter.js'

export async function runStep23Tests() {
  const BASE_URL = 'http://localhost:5000/api'
  console.log('==================================================================')
  console.log('     BIZFLOW AI — STEP 23 SECURITY & PRODUCTION HARDENING         ')
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

  // Helper to register test users
  async function createTestUser(prefix = 'sec') {
    const email = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}@bizflow.io`
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Bypass-Rate-Limit': 'true',
      },
      body: JSON.stringify({
        name: 'Security Analyst',
        email,
        password: 'Password123!',
      }),
    })
    const data = await res.json()
    if (!data.token) {
      throw new Error(`Auth failed: ${data.message || 'No token'}`)
    }
    return { token: data.token, user: data.user, email }
  }

  // -------------------------------------------------------------
  // 1. AUTHENTICATION ENFORCEMENT ON PRIVATE ROUTES
  // -------------------------------------------------------------
  const protectedEndpoints = [
    { method: 'GET', path: '/leads' },
    { method: 'GET', path: '/workflows' },
    { method: 'GET', path: '/analytics' },
    { method: 'GET', path: '/dashboard' },
    { method: 'GET', path: '/profile' },
    { method: 'GET', path: '/agents' },
    { method: 'GET', path: '/communications/status' },
  ]

  let allProtectedRejected = true
  for (const ep of protectedEndpoints) {
    const res = await fetch(`${BASE_URL}${ep.path}`, {
      method: ep.method,
      headers: { 'X-Test-Bypass-Rate-Limit': 'true' },
    })
    if (res.status !== 401) {
      allProtectedRejected = false
      console.error(`Endpoint ${ep.path} failed to reject unauthenticated request: status ${res.status}`)
    }
  }

  assert(
    1,
    'All Private API Routes Enforce Authentication (HTTP 401)',
    allProtectedRejected,
    `Tested ${protectedEndpoints.length} core API routes without authorization header`
  )

  // -------------------------------------------------------------
  // 2. INVALID, EXPIRED, & MALFORMED JWT REJECTION
  // -------------------------------------------------------------
  const invalidTokenRes = await fetch(`${BASE_URL}/leads`, {
    headers: {
      Authorization: 'Bearer invalid.token.string12345',
      'X-Test-Bypass-Rate-Limit': 'true',
    },
  })
  const malformedHeaderRes = await fetch(`${BASE_URL}/leads`, {
    headers: {
      Authorization: 'Basic dXNlcjpwYXNz',
      'X-Test-Bypass-Rate-Limit': 'true',
    },
  })
  const emptyBearerRes = await fetch(`${BASE_URL}/leads`, {
    headers: {
      Authorization: 'Bearer ',
      'X-Test-Bypass-Rate-Limit': 'true',
    },
  })

  assert(
    2,
    'Invalid, Malformed, and Non-Bearer Tokens Securely Rejected',
    invalidTokenRes.status === 401 &&
      malformedHeaderRes.status === 401 &&
      emptyBearerRes.status === 401,
    `Invalid: ${invalidTokenRes.status}, Non-Bearer: ${malformedHeaderRes.status}, Empty Bearer: ${emptyBearerRes.status}`
  )

  // -------------------------------------------------------------
  // 3. CROSS-TENANT AUTHORIZATION & DATA BOUNDARY GUARDS
  // -------------------------------------------------------------
  const userA = await createTestUser('tenant_a')
  const userB = await createTestUser('tenant_b')

  const headersA = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userA.token}`,
    'X-Test-Bypass-Rate-Limit': 'true',
  }
  const headersB = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userB.token}`,
    'X-Test-Bypass-Rate-Limit': 'true',
  }

  // User A creates a Lead
  const leadARes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: 'Confidential Lead A',
      email: 'leadA@enterprise.corp',
      company: 'Enterprise A',
      status: 'New',
    }),
  }).then((r) => r.json())
  const leadAId = leadARes.lead?._id || leadARes.lead?.id

  // User A creates a Visual Workflow
  const wfARes = await fetch(`${BASE_URL}/workflows`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: 'Private Workflow A',
      trigger: 'New Lead Created',
      nodes: [
        { id: 't1', type: 'trigger_new_lead', title: 'Trigger' },
        { id: 'a1', type: 'ai_analyze_lead', title: 'Analysis' },
      ],
      edges: [{ id: 'e1', source: 't1', target: 'a1' }],
    }),
  }).then((r) => r.json())
  const wfAId = wfARes.workflow?._id || wfARes.workflow?.id

  // User B attempts to access/modify User A's Lead
  const crossLeadGet = await fetch(`${BASE_URL}/leads/${leadAId}`, { headers: headersB })
  const crossLeadPut = await fetch(`${BASE_URL}/leads/${leadAId}`, {
    method: 'PUT',
    headers: headersB,
    body: JSON.stringify({ name: 'Hacked Lead' }),
  })
  const crossLeadAnalyze = await fetch(`${BASE_URL}/leads/${leadAId}/analyze`, {
    method: 'POST',
    headers: headersB,
  })

  // User B attempts to access/modify User A's Workflow
  const crossWfGet = await fetch(`${BASE_URL}/workflows/${wfAId}`, { headers: headersB })
  const crossWfPut = await fetch(`${BASE_URL}/workflows/${wfAId}`, {
    method: 'PUT',
    headers: headersB,
    body: JSON.stringify({ name: 'Hacked Workflow' }),
  })

  // User B attempts to generate communication for User A's Lead
  const crossCommDraft = await fetch(`${BASE_URL}/communications/draft`, {
    method: 'POST',
    headers: headersB,
    body: JSON.stringify({
      leadId: leadAId,
      channel: 'email',
    }),
  })

  assert(
    3,
    'Cross-Tenant Data Isolation: Unauthorized Access Rejected (HTTP 404)',
    crossLeadGet.status === 404 &&
      crossLeadPut.status === 404 &&
      crossLeadAnalyze.status === 404 &&
      crossWfGet.status === 404 &&
      crossWfPut.status === 404 &&
      crossCommDraft.status === 404,
    `Lead GET: ${crossLeadGet.status}, PUT: ${crossLeadPut.status}, WF GET: ${crossWfGet.status}, Comm: ${crossCommDraft.status}`
  )

  // -------------------------------------------------------------
  // 4. MONGODB OBJECTID PARAMETER VALIDATION
  // -------------------------------------------------------------
  const invalidIdLead = await fetch(`${BASE_URL}/leads/invalid-mongo-id-123`, { headers: headersA })
  const invalidIdWf = await fetch(`${BASE_URL}/workflows/not-an-id`, { headers: headersA })
  const invalidIdAgent = await fetch(`${BASE_URL}/agents/short-id`, { headers: headersA })

  assert(
    4,
    'Malformed Route ObjectId Parameters Rejected with HTTP 400',
    invalidIdLead.status === 400 &&
      invalidIdWf.status === 400 &&
      invalidIdAgent.status === 400,
    `Leads: ${invalidIdLead.status}, Workflows: ${invalidIdWf.status}, Agents: ${invalidIdAgent.status}`
  )

  // -------------------------------------------------------------
  // 5. NOSQL INJECTION & PROHIBITED OPERATOR SANITIZATION
  // -------------------------------------------------------------
  const noSqlInjectionRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Bypass-Rate-Limit': 'true',
    },
    body: JSON.stringify({
      email: { $gt: '' },
      password: 'Password123!',
    }),
  })

  const noSqlQueryRes = await fetch(`${BASE_URL}/leads?$where=true`, {
    headers: headersA,
  })

  assert(
    5,
    'NoSQL Injection Payloads Blocked with HTTP 400',
    noSqlInjectionRes.status === 400 && noSqlQueryRes.status === 400,
    `Body Injection: ${noSqlInjectionRes.status}, Query Injection: ${noSqlQueryRes.status}`
  )

  // -------------------------------------------------------------
  // 6. REQUEST PAYLOAD SIZE LIMIT ENFORCEMENT
  // -------------------------------------------------------------
  // Generate a payload exceeding 1MB (e.g. 1.2MB of repeated data)
  const largeData = 'x'.repeat(1.2 * 1024 * 1024)
  const oversizedRes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: 'Oversized Lead',
      email: 'large@enterprise.com',
      notes: largeData,
    }),
  })

  assert(
    6,
    'Oversized Request Payloads (> 1MB) Rejected with HTTP 413',
    oversizedRes.status === 413,
    `Status received: ${oversizedRes.status}`
  )

  // -------------------------------------------------------------
  // 7. MALFORMED JSON SYNTAX ERROR HANDLING
  // -------------------------------------------------------------
  const malformedJsonRes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: headersA,
    body: '{"name": "Broken JSON without closing bracket"',
  })

  const malformedData = await malformedJsonRes.json()
  assert(
    7,
    'Malformed JSON Syntax Handled Gracefully with HTTP 400',
    malformedJsonRes.status === 400 && malformedData.success === false,
    `Status: ${malformedJsonRes.status}, Message: "${malformedData.message}"`
  )

  // -------------------------------------------------------------
  // 8. SECURITY HEADERS VERIFICATION
  // -------------------------------------------------------------
  const healthRes = await fetch(`${BASE_URL}/health`)
  const headers = healthRes.headers

  const hasNoSniff = headers.get('x-content-type-options') === 'nosniff'
  const hasDenyFrame = headers.get('x-frame-options') === 'DENY'
  const hasXss = headers.get('x-xss-protection') === '0'
  const hasHsts = Boolean(headers.get('strict-transport-security'))
  const hasReferrer = headers.get('referrer-policy') === 'strict-origin-when-cross-origin'
  const hasCsp = Boolean(headers.get('content-security-policy'))

  assert(
    8,
    'Standard Security Headers Enforced on API Responses',
    hasNoSniff && hasDenyFrame && hasXss && hasHsts && hasReferrer && hasCsp,
    `X-Content-Type: ${headers.get('x-content-type-options')}, X-Frame: ${headers.get('x-frame-options')}`
  )

  // -------------------------------------------------------------
  // 9. FRAMEWORK DISCLOSURE DISABLED
  // -------------------------------------------------------------
  const hasXPoweredBy = headers.has('x-powered-by')
  assert(
    9,
    'Framework Disclosure Header Disabled (X-Powered-By absent)',
    !hasXPoweredBy,
    `X-Powered-By present: ${hasXPoweredBy}`
  )

  // -------------------------------------------------------------
  // 10. CORS CONFIGURATION & ORIGIN RESTRICTION
  // -------------------------------------------------------------
  const allowedCorsRes = await fetch(`${BASE_URL}/health`, {
    headers: { Origin: 'http://localhost:5176' },
  })
  const allowedCorsHeader = allowedCorsRes.headers.get('access-control-allow-origin')

  const unallowedCorsRes = await fetch(`${BASE_URL}/health`, {
    headers: { Origin: 'http://malicious-attacker.com' },
  })
  const unallowedCorsHeader = unallowedCorsRes.headers.get('access-control-allow-origin')

  assert(
    10,
    'CORS Restricts Unauthorized Origins',
    allowedCorsHeader === 'http://localhost:5176' && unallowedCorsHeader !== 'http://malicious-attacker.com',
    `Allowed origin header: ${allowedCorsHeader}, Malicious origin header: ${unallowedCorsHeader}`
  )

  // -------------------------------------------------------------
  // 11. RATE LIMITING ON SENSITIVE ENDPOINTS
  // -------------------------------------------------------------
  resetRateLimits()
  let rateLimited = false
  let attempts = 0

  // Trigger auth rate limiter threshold (max 30)
  for (let i = 0; i < 35; i++) {
    attempts++
    const testRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Rate-Limit-Check': 'true',
      },
      body: JSON.stringify({
        email: 'nobody@bizflow.io',
        password: 'wrong_password',
      }),
    })
    if (testRes.status === 429) {
      rateLimited = true
      break
    }
  }

  assert(
    11,
    'Rate Limiting Triggers HTTP 429 on Sensitive Endpoints',
    rateLimited,
    `Triggered HTTP 429 after ${attempts} rapid attempts`
  )
  await fetch(`${BASE_URL}/health/reset-rate-limits`, { method: 'POST' })
  resetRateLimits()

  // -------------------------------------------------------------
  // 12. SAFE ERROR HANDLING & NO STACK TRACE LEAKAGE
  // -------------------------------------------------------------
  const notFoundRes = await fetch(`${BASE_URL}/non-existent-route-xyz`)
  const notFoundJson = await notFoundRes.json()
  const notFoundString = JSON.stringify(notFoundJson)

  const noStackLeaked =
    !notFoundString.includes('at ') &&
    !notFoundString.includes('node_modules') &&
    !notFoundString.includes('src/') &&
    !notFoundJson.stack

  assert(
    12,
    'Central Error Handler Never Exposes Stack Traces or Internal Paths',
    notFoundRes.status === 404 && noStackLeaked,
    `Status: ${notFoundRes.status}, Stack present: ${Boolean(notFoundJson.stack)}`
  )

  // -------------------------------------------------------------
  // 13. STATELESS LOGOUT ACKNOWLEDGMENT
  // -------------------------------------------------------------
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: headersA,
  })
  const logoutJson = await logoutRes.json()

  assert(
    13,
    'Secure Logout Endpoint Responds with 200 Acknowledgment',
    logoutRes.status === 200 && logoutJson.success === true,
    `Status: ${logoutRes.status}, Message: "${logoutJson.message}"`
  )

  // -------------------------------------------------------------
  // 14. COMMUNICATION HUMAN APPROVAL MANDATE
  // -------------------------------------------------------------
  const unapprovedSendRes = await fetch(`${BASE_URL}/communications/send`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      leadId: leadAId,
      channel: 'email',
      recipient: 'leadA@enterprise.corp',
      subject: 'Outreach',
      content: 'Hello',
      humanApproved: false, // Prohibited!
    }),
  })

  assert(
    14,
    'External Communication Rejects Unapproved Send (HTTP 400)',
    unapprovedSendRes.status === 400,
    `Status received: ${unapprovedSendRes.status}`
  )

  // -------------------------------------------------------------
  // 15. COMMUNICATION SANDBOX MODE PRESERVED
  // -------------------------------------------------------------
  const approvedSendRes = await fetch(`${BASE_URL}/communications/send`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      leadId: leadAId,
      channel: 'email',
      recipient: 'leadA@enterprise.corp',
      subject: 'Outreach',
      content: 'Hello, approved by human.',
      humanApproved: true,
    }),
  }).then((r) => r.json())

  assert(
    15,
    'Communication Sends Remain in Development Sandbox Mode',
    approvedSendRes.success === true &&
      (approvedSendRes.result?.simulated === true || approvedSendRes.result?.mode === 'sandbox'),
    `Mode: ${approvedSendRes.result?.mode}, Simulated: ${approvedSendRes.result?.simulated}`
  )

  // -------------------------------------------------------------
  // 16. AI ADVISORY SAFETY (READ-ONLY)
  // -------------------------------------------------------------
  const leadsBefore = await fetch(`${BASE_URL}/leads`, { headers: headersA }).then((r) => r.json())
  const insightsRes = await fetch(`${BASE_URL}/analytics/insights`, { headers: headersA })
  const leadsAfter = await fetch(`${BASE_URL}/leads`, { headers: headersA }).then((r) => r.json())

  assert(
    16,
    'AI Strategic Insights Are Strictly Read-Only (Zero CRM Mutations)',
    insightsRes.status === 200 && leadsBefore.leads?.length === leadsAfter.leads?.length,
    `Lead counts unchanged: ${leadsAfter.leads?.length}`
  )

  // -------------------------------------------------------------
  // 17. VISUAL WORKFLOW BUILDER HUMAN APPROVAL GUARD
  // -------------------------------------------------------------
  const unapprovedWfValidation = await fetch(`${BASE_URL}/workflows/validate`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: 'Unsafe Workflow',
      trigger: 'New Lead Created',
      nodes: [
        { id: 't1', type: 'trigger_new_lead', title: 'Trigger' },
        {
          id: 'c1',
          type: 'comm_send_email',
          title: 'Send Email',
          config: { humanApprovalRequired: false }, // Disallowed!
        },
      ],
      edges: [{ id: 'e1', source: 't1', target: 'c1' }],
    }),
  }).then((r) => r.json())

  assert(
    17,
    'Workflow Builder Enforces humanApprovalRequired on Communication Nodes',
    unapprovedWfValidation.isValid === false &&
      unapprovedWfValidation.errors?.some(
        (e) =>
          e.toLowerCase().includes('human approval') ||
          e.toLowerCase().includes('human review')
      ),
    `Errors: "${unapprovedWfValidation.errors?.join('; ')}"`
  )

  // -------------------------------------------------------------
  // 18. SECRET & CREDENTIAL PROTECTION IN API RESPONSES
  // -------------------------------------------------------------
  const analyticsRes = await fetch(`${BASE_URL}/analytics`, { headers: headersA })
  const analyticsData = await analyticsRes.json()
  const serialized = JSON.stringify({
    userA,
    leadARes,
    wfARes,
    analyticsData,
    approvedSendRes,
  })

  const safePayload =
    !serialized.includes('AIza') &&
    !serialized.includes('sk_live_') &&
    !serialized.includes('sk_test_') &&
    !serialized.includes('GEMINI_API_KEY') &&
    !serialized.includes('TWILIO_AUTH_TOKEN') &&
    !serialized.includes('SMTP_PASS') &&
    !serialized.includes('process.env')

  assert(
    18,
    'Zero Secrets, Tokens, or Private Environment Variables in API Responses',
    safePayload,
    'Payload verified free of API keys and provider credentials'
  )

  // -------------------------------------------------------------
  // 19. USER PROFILE SANITIZATION (NO PASSWORD HASH)
  // -------------------------------------------------------------
  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: headersA })
  const meData = await meRes.json()
  const profileRes = await fetch(`${BASE_URL}/profile`, { headers: headersA })
  const profileData = await profileRes.json()

  const safeMe = meData.user && meData.user.passwordHash === undefined
  const safeProfile = profileData.profile && profileData.profile.passwordHash === undefined

  assert(
    19,
    'User Profiles Omit passwordHash Field Permanently',
    safeMe && safeProfile,
    `passwordHash in /me: ${Boolean(meData.user?.passwordHash)}, in /profile: ${Boolean(profileData.profile?.passwordHash)}`
  )

  // -------------------------------------------------------------
  // 20. RECIPIENT FORMAT VALIDATION FOR COMMUNICATIONS
  // -------------------------------------------------------------
  const badRecipientRes = await fetch(`${BASE_URL}/communications/send`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      leadId: leadAId,
      channel: 'email',
      recipient: 'not-an-email-address',
      subject: 'Test',
      content: 'Message',
      humanApproved: true,
    }),
  })

  assert(
    20,
    'Malformed Communication Recipient Formats Rejected with HTTP 400',
    badRecipientRes.status === 400,
    `Status received: ${badRecipientRes.status}`
  )

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n==================================================================')
  console.log(`TOTAL SECURITY TESTS: ${results.passed.length + results.failed.length}`)
  console.log(`PASSED:               ${results.passed.length}`)
  console.log(`FAILED:               ${results.failed.length}`)
  console.log('==================================================================\n')

  if (results.failed.length > 0) {
    throw new Error(`Step 23 test suite failed with ${results.failed.length} failures.`)
  }
  return results
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('step23Security.test.js')) {
  runStep23Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

export default runStep23Tests
