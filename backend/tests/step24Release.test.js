/**
 * BizFlow AI — Step 24 Final Deployment & Release Verification Test Suite
 * Validates:
 * 1. Health check endpoint reporting and schema
 * 2. Standard production security response headers
 * 3. Framework disclosure disabled (X-Powered-By absent)
 * 4. CORS allowlist parsing (supports configured URLs and rejects disallowed origins)
 * 5. Safe error handling (zero stack traces or internal server paths exposed)
 * 6. Vercel SPA deployment configuration integrity (frontend/vercel.json)
 * 7. Render deployment blueprint integrity (render.yaml)
 * 8. Frontend environment configuration template (frontend/.env.example)
 * 9. Frontend production build bundle verification (frontend/dist/index.html)
 * 10. AI Context documentation files verification (AGENTS.md, AI-CONTEXT.md, docs/DEVELOPMENT-GUIDE.md)
 * 11. Communication sandbox simulation and mandatory human approval enforcement
 * 12. Visual workflow builder validation enforcement (humanApprovalRequired guard)
 * 13. Multi-tenant data isolation on private API resources (HTTP 404 on cross-user access)
 * 14. Zero credentials, secrets, or passwords in API responses or user profiles
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { resetRateLimits } from '../src/middleware/rateLimiter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../../')

export async function runStep24Tests() {
  const BASE_URL = 'http://localhost:5000/api'
  console.log('==================================================================')
  console.log('     BIZFLOW AI — STEP 24 FINAL RELEASE & DEPLOYMENT TESTS        ')
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

  // Reset rate limits to ensure test isolation
  resetRateLimits()

  // -------------------------------------------------------------
  // 1. HEALTH CHECK ENDPOINT
  // -------------------------------------------------------------
  const healthRes = await fetch(`${BASE_URL}/health`)
  const healthData = await healthRes.json()

  assert(
    1,
    'Backend Health Check Endpoint Responds with 200 and Status Schema',
    healthRes.status === 200 &&
      healthData.success === true &&
      typeof healthData.database?.status === 'string' &&
      typeof healthData.database?.readyState === 'number',
    `Status: ${healthRes.status}, DB Status: ${healthData.database?.status}, ReadyState: ${healthData.database?.readyState}`
  )

  // -------------------------------------------------------------
  // 2. DEFENSE-IN-DEPTH SECURITY HEADERS
  // -------------------------------------------------------------
  const secHeaders = healthRes.headers
  const hasContentTypeOptions = secHeaders.get('x-content-type-options') === 'nosniff'
  const hasFrameOptions = secHeaders.get('x-frame-options') === 'DENY'
  const hasHsts = Boolean(secHeaders.get('strict-transport-security'))
  const hasCsp = Boolean(secHeaders.get('content-security-policy'))
  const hasReferrerPolicy = secHeaders.get('referrer-policy') === 'strict-origin-when-cross-origin'

  assert(
    2,
    'Production Security Headers Enforced on API Responses',
    hasContentTypeOptions && hasFrameOptions && hasHsts && hasCsp && hasReferrerPolicy,
    `nosniff: ${hasContentTypeOptions}, DENY: ${hasFrameOptions}, HSTS: ${hasHsts}, CSP: ${hasCsp}`
  )

  // -------------------------------------------------------------
  // 3. FRAMEWORK DISCLOSURE HEADER DISABLED
  // -------------------------------------------------------------
  const hasPoweredBy = secHeaders.has('x-powered-by')

  assert(
    3,
    'Framework Disclosure Header (X-Powered-By) Disabled',
    !hasPoweredBy,
    `X-Powered-By header absent: ${!hasPoweredBy}`
  )

  // -------------------------------------------------------------
  // 4. CORS ALLOWLIST RESTRICTION
  // -------------------------------------------------------------
  const allowedOriginRes = await fetch(`${BASE_URL}/health`, {
    headers: { Origin: 'http://localhost:5176' },
  })
  const disallowedOriginRes = await fetch(`${BASE_URL}/health`, {
    headers: { Origin: 'http://unauthorized-attacker.xyz' },
  })

  const allowedHeader = allowedOriginRes.headers.get('access-control-allow-origin')
  const disallowedHeader = disallowedOriginRes.headers.get('access-control-allow-origin')

  assert(
    4,
    'CORS Restricts Unauthorized Origins while Allowing Configured Client Origins',
    allowedHeader === 'http://localhost:5176' && disallowedHeader !== 'http://unauthorized-attacker.xyz',
    `Allowed: "${allowedHeader}", Disallowed: "${disallowedHeader}"`
  )

  // -------------------------------------------------------------
  // 5. ERROR SANITIZATION (ZERO STACK TRACES)
  // -------------------------------------------------------------
  const notFoundRes = await fetch(`${BASE_URL}/non-existent-endpoint-probe-xyz`)
  const notFoundJson = await notFoundRes.json()
  const notFoundStr = JSON.stringify(notFoundJson)

  const noStackOrPath =
    !notFoundStr.includes('at ') &&
    !notFoundStr.includes('node_modules') &&
    !notFoundStr.includes('src/') &&
    !notFoundJson.stack

  assert(
    5,
    'Central Error Handler Never Exposes Stack Traces or Internal Paths',
    notFoundRes.status === 404 && noStackOrPath,
    `Status: ${notFoundRes.status}, Stack present: ${Boolean(notFoundJson.stack)}`
  )

  // -------------------------------------------------------------
  // 6. VERCEL SPA DEPLOYMENT CONFIGURATION (vercel.json)
  // -------------------------------------------------------------
  const vercelJsonPath = path.join(ROOT_DIR, 'frontend', 'vercel.json')
  let vercelConfigValid = false
  if (fs.existsSync(vercelJsonPath)) {
    try {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'))
      vercelConfigValid =
        Array.isArray(vercelConfig.rewrites) &&
        vercelConfig.rewrites.some(
          (r) => r.source === '/(.*)' && r.destination === '/index.html'
        )
    } catch {
      vercelConfigValid = false
    }
  }

  assert(
    6,
    'Vercel SPA Deployment Configuration Valid (frontend/vercel.json)',
    vercelConfigValid,
    `File exists and contains SPA rewrites: ${vercelConfigValid}`
  )

  // -------------------------------------------------------------
  // 7. RENDER BLUEPRINT CONFIGURATION (render.yaml)
  // -------------------------------------------------------------
  const renderYamlPath = path.join(ROOT_DIR, 'render.yaml')
  let renderYamlValid = false
  if (fs.existsSync(renderYamlPath)) {
    const renderContent = fs.readFileSync(renderYamlPath, 'utf8')
    renderYamlValid =
      renderContent.includes('bizflow-ai-backend') &&
      renderContent.includes('npm install') &&
      renderContent.includes('npm start') &&
      renderContent.includes('/api/health') &&
      renderContent.includes('MONGODB_URI')
  }

  assert(
    7,
    'Render Deployment Blueprint Specification Valid (render.yaml)',
    renderYamlValid,
    `render.yaml exists with Web Service, start command, and health check: ${renderYamlValid}`
  )

  // -------------------------------------------------------------
  // 8. FRONTEND ENVIRONMENT CONFIGURATION TEMPLATE
  // -------------------------------------------------------------
  const frontendEnvExamplePath = path.join(ROOT_DIR, 'frontend', '.env.example')
  let frontendEnvValid = false
  if (fs.existsSync(frontendEnvExamplePath)) {
    const envContent = fs.readFileSync(frontendEnvExamplePath, 'utf8')
    frontendEnvValid = envContent.includes('VITE_API_BASE_URL')
  }

  assert(
    8,
    'Frontend Environment Template Exists (frontend/.env.example)',
    frontendEnvValid,
    `Documents VITE_API_BASE_URL: ${frontendEnvValid}`
  )

  // -------------------------------------------------------------
  // 9. FRONTEND PRODUCTION BUILD VERIFICATION
  // -------------------------------------------------------------
  const distIndexPath = path.join(ROOT_DIR, 'frontend', 'dist', 'index.html')
  let distValid = false
  if (fs.existsSync(distIndexPath)) {
    const distHtml = fs.readFileSync(distIndexPath, 'utf8')
    distValid = distHtml.includes('id="root"') && distHtml.includes('/assets/')
  }

  assert(
    9,
    'Frontend Production Build Artifact Exists (frontend/dist/index.html)',
    distValid,
    `index.html exists with root div and bundled assets: ${distValid}`
  )

  // -------------------------------------------------------------
  // 10. AI CONTEXT DOCUMENTATION FILES VERIFICATION
  // -------------------------------------------------------------
  const agentsMdPath = path.join(ROOT_DIR, 'AGENTS.md')
  const aiContextPath = path.join(ROOT_DIR, 'AI-CONTEXT.md')
  const devGuidePath = path.join(ROOT_DIR, 'docs', 'DEVELOPMENT-GUIDE.md')

  const hasAgentsMd = fs.existsSync(agentsMdPath) && fs.readFileSync(agentsMdPath, 'utf8').length > 500
  const hasAiContext = fs.existsSync(aiContextPath) && fs.readFileSync(aiContextPath, 'utf8').length > 500
  const hasDevGuide = fs.existsSync(devGuidePath) && fs.readFileSync(devGuidePath, 'utf8').length > 500

  assert(
    10,
    'AI Context Documentation Files Complete (AGENTS.md, AI-CONTEXT.md, DEVELOPMENT-GUIDE.md)',
    hasAgentsMd && hasAiContext && hasDevGuide,
    `AGENTS.md: ${hasAgentsMd}, AI-CONTEXT.md: ${hasAiContext}, DEVELOPMENT-GUIDE.md: ${hasDevGuide}`
  )

  // -------------------------------------------------------------
  // AUTHENTICATE TEST USERS FOR OPERATIONAL TESTS
  // -------------------------------------------------------------
  const testEmailA = `release.test.a.${Date.now()}@bizflow.ai`
  const userARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Release Auditor A',
      email: testEmailA,
      password: 'SecurePassword123!',
      businessName: 'Auditor Corp A',
    }),
  }).then((r) => r.json())

  const tokenA = userARes.token
  const headersA = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenA}`,
    'X-Test-Bypass-Rate-Limit': 'true',
  }

  const testEmailB = `release.test.b.${Date.now()}@bizflow.ai`
  const userBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Release Auditor B',
      email: testEmailB,
      password: 'SecurePassword123!',
      businessName: 'Auditor Corp B',
    }),
  }).then((r) => r.json())

  const tokenB = userBRes.token
  const headersB = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenB}`,
    'X-Test-Bypass-Rate-Limit': 'true',
  }

  // Create test lead for user A
  const leadARes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: 'Release Verification Lead',
      email: 'lead@enterprise.com',
      company: 'Enterprise Corp',
      phone: '+15552345678',
      status: 'New',
    }),
  }).then((r) => r.json())
  const leadAId = leadARes.lead?._id

  // -------------------------------------------------------------
  // 11. COMMUNICATION SANDBOX & HUMAN APPROVAL ENFORCEMENT
  // -------------------------------------------------------------
  const unapprovedSendRes = await fetch(`${BASE_URL}/communications/send`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      leadId: leadAId,
      channel: 'email',
      recipient: 'lead@enterprise.com',
      subject: 'Outreach',
      content: 'Hello',
      humanApproved: false, // Disallowed!
    }),
  })

  const approvedSendRes = await fetch(`${BASE_URL}/communications/send`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      leadId: leadAId,
      channel: 'email',
      recipient: 'lead@enterprise.com',
      subject: 'Outreach',
      content: 'Hello, approved by human.',
      humanApproved: true,
    }),
  }).then((r) => r.json())

  assert(
    11,
    'Communication Human Approval Mandate & Development Sandbox Preserved',
    unapprovedSendRes.status === 400 &&
      approvedSendRes.success === true &&
      approvedSendRes.result?.simulated === true,
    `Unapproved status: ${unapprovedSendRes.status}, Approved simulated: ${approvedSendRes.result?.simulated}`
  )

  // -------------------------------------------------------------
  // 12. VISUAL WORKFLOW BUILDER HUMAN APPROVAL GUARD
  // -------------------------------------------------------------
  const invalidWfValidation = await fetch(`${BASE_URL}/workflows/validate`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: 'Automated Outreach',
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
    12,
    'Workflow Builder Enforces humanApprovalRequired on Communication Nodes',
    invalidWfValidation.isValid === false &&
      invalidWfValidation.errors?.some((e) => e.toLowerCase().includes('human approval')),
    `Validation rejected with: "${invalidWfValidation.errors?.join('; ')}"`
  )

  // -------------------------------------------------------------
  // 13. MULTI-TENANT ISOLATION (CROSS-USER 404)
  // -------------------------------------------------------------
  const crossUserLeadRes = await fetch(`${BASE_URL}/leads/${leadAId}`, {
    headers: headersB,
  })

  assert(
    13,
    'Cross-Tenant Data Isolation Verified (User B receives HTTP 404 on User A lead)',
    crossUserLeadRes.status === 404,
    `Status received: ${crossUserLeadRes.status}`
  )

  // -------------------------------------------------------------
  // 14. ZERO CREDENTIALS, SECRETS, OR PASSWORD HASHES LEAKED
  // -------------------------------------------------------------
  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: headersA })
  const meData = await meRes.json()
  const serialized = JSON.stringify(meData)

  const safeMe =
    meData.user?.passwordHash === undefined &&
    !serialized.includes('AIza') &&
    !serialized.includes('sk_live_')

  assert(
    14,
    'User Profiles and API Payloads Never Expose Secrets or Password Hash',
    safeMe,
    `passwordHash absent: ${meData.user?.passwordHash === undefined}`
  )

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n==================================================================')
  console.log(`TOTAL RELEASE TESTS: ${results.passed.length + results.failed.length}`)
  console.log(`PASSED:              ${results.passed.length}`)
  console.log(`FAILED:              ${results.failed.length}`)
  console.log('==================================================================\n')

  if (results.failed.length > 0) {
    throw new Error(`Step 24 test suite failed with ${results.failed.length} failures.`)
  }
  return results
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('step24Release.test.js')) {
  runStep24Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

export default runStep24Tests
