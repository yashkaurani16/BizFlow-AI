/**
 * BizFlow AI — Step 20 External Communication Integrations Test Suite
 * Validates:
 * 1. Provider Configuration & Sanitization (Email, WhatsApp, SMS)
 * 2. Recipient Format Validation (RFC 5322 & E.164)
 * 3. AI Draft Generation for Email, WhatsApp, and SMS
 * 4. Human Review Requirement enforcement (No autonomous sending)
 * 5. Explicit Human Approval Gate (400 if humanApproved is not true)
 * 6. Multi-Channel Dispatch (Email, WhatsApp, SMS)
 * 7. Activity Audit Logging (Channel, Recipient, Approval, Timestamp)
 * 8. Secret & Credential Leakage Protection
 * 9. Authentication & Multi-Tenant Authorization Guards
 * 10. Workflow Isolation (New Lead Workflow does NOT autonomously send messages)
 */

import communicationService, {
  emailAdapter,
  whatsappAdapter,
  smsAdapter,
  draftService,
} from '../src/services/communications/index.js'
import { executeNewLeadWorkflow } from '../src/services/workflowEngine.js'

export async function runStep20Tests() {
  const BASE_URL = 'http://localhost:5000/api'
  console.log('==================================================================')
  console.log('       BIZFLOW AI — STEP 20 EXTERNAL COMMUNICATIONS TESTS         ')
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
    _id: '67890abcdef1234567890abc',
    id: '67890abcdef1234567890abc',
    name: 'Elena Rostova',
    company: 'Vanguard Global Systems',
    email: 'elena.rostova@vanguard.io',
    phone: '+14155552671',
    status: 'New',
    budget: '$85,000',
    notes: 'Inquiry regarding multi-channel operations automation and lead dispatch.',
    score: 88,
  }

  // -------------------------------------------------------------
  // 1. PROVIDER CONFIGURATION & SANITIZATION
  // -------------------------------------------------------------
  const emailStatus = emailAdapter.getProviderStatus()
  assert(
    1,
    'Email Adapter Status Sanitization',
    emailStatus.channel === 'email' &&
      typeof emailStatus.isConfigured === 'boolean' &&
      !JSON.stringify(emailStatus).includes('pass') &&
      !JSON.stringify(emailStatus).includes('secret'),
    `Provider: ${emailStatus.provider}, Mode: ${emailStatus.mode}`
  )

  const waStatus = whatsappAdapter.getProviderStatus()
  assert(
    2,
    'WhatsApp Adapter Status Sanitization',
    waStatus.channel === 'whatsapp' &&
      typeof waStatus.isConfigured === 'boolean' &&
      !JSON.stringify(waStatus).includes('authToken') &&
      !JSON.stringify(waStatus).includes('secret'),
    `Provider: ${waStatus.provider}, Mode: ${waStatus.mode}`
  )

  const smsStatus = smsAdapter.getProviderStatus()
  assert(
    3,
    'SMS Adapter Status Sanitization',
    smsStatus.channel === 'sms' &&
      typeof smsStatus.isConfigured === 'boolean' &&
      !JSON.stringify(smsStatus).includes('authToken') &&
      !JSON.stringify(smsStatus).includes('secret'),
    `Provider: ${smsStatus.provider}, Mode: ${smsStatus.mode}`
  )

  const allStatuses = communicationService.getAllProviderStatuses()
  assert(
    4,
    'Master Communication Status Aggregation',
    Boolean(allStatuses.email && allStatuses.whatsapp && allStatuses.sms && allStatuses.humanReviewPolicy),
    'Contains all 3 channels + explicit Human Review policy'
  )

  // -------------------------------------------------------------
  // 2. RECIPIENT FORMAT VALIDATION
  // -------------------------------------------------------------
  const validEmail = emailAdapter.validateEmailRecipient('contact@business.org')
  const invalidEmail = emailAdapter.validateEmailRecipient('invalid-email-string')
  assert(
    5,
    'Email Recipient Format Validation',
    validEmail.valid === true && invalidEmail.valid === false,
    `Rejects malformed emails: "${invalidEmail.error}"`
  )

  const validWa = whatsappAdapter.validateWhatsAppRecipient('+1 415-555-2671')
  const invalidWa = whatsappAdapter.validateWhatsAppRecipient('abc123')
  assert(
    6,
    'WhatsApp Recipient Format Validation',
    validWa.valid === true && validWa.recipient === '+14155552671' && invalidWa.valid === false,
    `Normalizes valid E.164 and rejects invalid numbers`
  )

  const validSms = smsAdapter.validateSmsRecipient('+91 98765 43210')
  const invalidSms = smsAdapter.validateSmsRecipient('123')
  assert(
    7,
    'SMS Recipient Format Validation',
    validSms.valid === true && validSms.recipient === '+919876543210' && invalidSms.valid === false,
    `Validates international E.164 phone numbering`
  )

  // -------------------------------------------------------------
  // 3. AI DRAFT GENERATION
  // -------------------------------------------------------------
  const emailDraft = await draftService.generateCommunicationDraft(sampleLead, 'email')
  assert(
    8,
    'AI Email Draft Generation',
    Boolean(
      emailDraft.subject &&
      emailDraft.body &&
      emailDraft.aiGenerated === true &&
      emailDraft.humanReviewRequired === true &&
      emailDraft.notice.includes('Human Review')
    ),
    `Subject: "${emailDraft.subject.slice(0, 40)}..."`
  )

  const waDraft = await draftService.generateCommunicationDraft(sampleLead, 'whatsapp')
  assert(
    9,
    'AI WhatsApp Draft Generation',
    Boolean(
      waDraft.body &&
      waDraft.aiGenerated === true &&
      waDraft.humanReviewRequired === true &&
      waDraft.channel === 'whatsapp'
    ),
    `Body length: ${waDraft.body.length} chars`
  )

  const smsDraft = await draftService.generateCommunicationDraft(sampleLead, 'sms')
  assert(
    10,
    'AI SMS Draft Generation',
    Boolean(
      smsDraft.body &&
      smsDraft.characterCount > 0 &&
      smsDraft.aiGenerated === true &&
      smsDraft.humanReviewRequired === true &&
      smsDraft.channel === 'sms'
    ),
    `Length: ${smsDraft.characterCount} chars (<= 160 recommended)`
  )

  // -------------------------------------------------------------
  // 4. HUMAN APPROVAL REQUIREMENT ENFORCEMENT
  // -------------------------------------------------------------
  let unapprovedRejected = false
  try {
    await communicationService.sendCommunication({
      channel: 'email',
      recipient: 'client@example.com',
      subject: 'Hello',
      content: 'Important message',
      humanApproved: false, // NOT APPROVED
    })
  } catch (err) {
    if (err.code === 'HUMAN_APPROVAL_REQUIRED') {
      unapprovedRejected = true
    }
  }
  assert(
    11,
    'Human Review Requirement Guard (Service Layer)',
    unapprovedRejected === true,
    'Throws HUMAN_APPROVAL_REQUIRED when humanApproved !== true'
  )

  // -------------------------------------------------------------
  // 5. SUCCESSFUL DISPATCH & AUDIT LOGGING (SANDBOX/LIVE)
  // -------------------------------------------------------------
  const emailSend = await communicationService.sendCommunication({
    channel: 'email',
    recipient: 'elena.rostova@vanguard.io',
    subject: 'Intro to BizFlow AI',
    content: 'Hi Elena, let us connect this week.',
    humanApproved: true,
    isAiGenerated: true,
  })
  assert(
    12,
    'Approved Email Dispatch & Receipt (Sandbox Simulated)',
    Boolean(emailSend.success && emailSend.messageId && emailSend.deliveredAt && emailSend.humanApproved && emailSend.simulated === true),
    `MessageId: ${emailSend.messageId}, Mode: ${emailSend.mode}, Simulated: ${emailSend.simulated}`
  )

  const waSend = await communicationService.sendCommunication({
    channel: 'whatsapp',
    recipient: '+14155552671',
    content: 'Hi Elena, following up on your inquiry.',
    humanApproved: true,
    isAiGenerated: true,
  })
  assert(
    13,
    'Approved WhatsApp Dispatch & Receipt (Sandbox Simulated)',
    Boolean(waSend.success && waSend.messageId && waSend.channel === 'whatsapp' && waSend.simulated === true),
    `MessageId: ${waSend.messageId}, Simulated: ${waSend.simulated}`
  )

  const smsSend = await communicationService.sendCommunication({
    channel: 'sms',
    recipient: '+14155552671',
    content: 'BizFlow AI: Reply YES to schedule a call.',
    humanApproved: true,
    isAiGenerated: false,
  })
  assert(
    14,
    'Approved SMS Dispatch & Receipt (Sandbox Simulated)',
    Boolean(smsSend.success && smsSend.messageId && smsSend.characterCount > 0 && smsSend.simulated === true),
    `MessageId: ${smsSend.messageId}, Chars: ${smsSend.characterCount}, Simulated: ${smsSend.simulated}`
  )

  // -------------------------------------------------------------
  // 6. WORKFLOW INTEGRATION BOUNDARY VERIFICATION
  // -------------------------------------------------------------
  const mockUserId = 'user_step20_boundary_test'
  const workflowResult = await executeNewLeadWorkflow(sampleLead, mockUserId)
  const isSucceeded = workflowResult && workflowResult.success === true && workflowResult.execution?.status === 'Succeeded'
  const activitiesStr = JSON.stringify(workflowResult.lead?.activities || []).toLowerCase()
  const noAutoMessaging = !activitiesStr.includes('email') && !activitiesStr.includes('whatsapp') && !activitiesStr.includes('sms')

  assert(
    15,
    'Workflow Isolation (No Autonomous Messaging in New Lead Workflow)',
    isSucceeded && noAutoMessaging,
    'Preserves strict 5-step qualification sequence without automated messaging'
  )

  // -------------------------------------------------------------
  // 7. HTTP API ENDPOINTS VERIFICATION (AGAINST RUNNING SERVER)
  // -------------------------------------------------------------
  // A. Unauthenticated check
  try {
    const unauthRes = await fetch(`${BASE_URL}/communications/status`)
    assert(
      16,
      'HTTP 401 on Unauthenticated Status Request',
      unauthRes.status === 401,
      `Received status ${unauthRes.status}`
    )
  } catch (err) {
    assert(16, 'HTTP 401 on Unauthenticated Status Request', false, err.message)
  }

  // B. Authenticate test user
  let token = null
  try {
    const testUserPayload = {
      email: `comm_user_${Date.now()}@bizflow.ai`,
      password: 'SecurePassword123!',
      name: 'Communications Officer',
    }
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserPayload),
    })
    const regData = await regRes.json()
    token = regData.token
  } catch (err) {
    console.warn('Could not register test user via HTTP:', err.message)
  }

  if (token) {
    // C. Authenticated status check
    const authStatusRes = await fetch(`${BASE_URL}/communications/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const authStatusData = await authStatusRes.json()
    assert(
      17,
      'Authenticated GET /api/communications/status',
      authStatusRes.status === 200 && authStatusData.success === true && Boolean(authStatusData.data.email),
      `Status returned: ${authStatusData.data.email.status}`
    )

    // D. Create lead for test user
    const createLeadRes = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Marcus Vance',
        email: 'marcus@vanceenterprises.com',
        phone: '+14155558833',
        company: 'Vance Enterprises',
        notes: 'Interested in CRM workflow optimization.',
      }),
    })
    const createLeadData = await createLeadRes.json()
    const leadId = createLeadData.lead?._id || createLeadData.lead?.id

    // E. Draft generation via API
    const draftRes = await fetch(`${BASE_URL}/communications/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        leadId,
        channel: 'email',
      }),
    })
    const draftData = await draftRes.json()
    assert(
      18,
      'POST /api/communications/draft (AI Generated Draft & Activity Log)',
      draftRes.status === 200 &&
        draftData.success === true &&
        Boolean(draftData.draft?.subject && draftData.draft?.body) &&
        draftData.draft.humanReviewRequired === true &&
        Boolean(draftData.activity && draftData.activity.type === 'communication_draft_generated' && draftData.activity.humanApproved === false),
      `Draft Notice: "${draftData.draft?.notice}", Activity: ${draftData.activity?.type}`
    )

    // F. Send rejection without human approval via API
    const unapprovedSendRes = await fetch(`${BASE_URL}/communications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        leadId,
        channel: 'email',
        recipient: 'marcus@vanceenterprises.com',
        subject: 'Follow-up',
        content: 'Hello Marcus',
        humanApproved: false, // NOT APPROVED
      }),
    })
    const unapprovedData = await unapprovedSendRes.json()
    assert(
      19,
      'POST /api/communications/send rejects unapproved request (HTTP 400)',
      unapprovedSendRes.status === 400 && unapprovedData.code === 'HUMAN_APPROVAL_REQUIRED',
      `Message: "${unapprovedData.message}"`
    )

    // G. Invalid recipient handling
    const invalidRecipRes = await fetch(`${BASE_URL}/communications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        leadId,
        channel: 'whatsapp',
        recipient: 'not-a-phone-number',
        content: 'Hello',
        humanApproved: true,
      }),
    })
    assert(
      20,
      'POST /api/communications/send rejects invalid recipient',
      invalidRecipRes.status === 400,
      `Status: ${invalidRecipRes.status}`
    )

    // H. Valid human-approved send & activity creation
    const validSendRes = await fetch(`${BASE_URL}/communications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        leadId,
        channel: 'email',
        recipient: 'marcus@vanceenterprises.com',
        subject: draftData.draft?.subject || 'Connecting regarding BizFlow AI',
        content: draftData.draft?.body || 'Hello Marcus, exploring business automation.',
        humanApproved: true,
        isAiGenerated: true,
      }),
    })
    const validSendData = await validSendRes.json()
    assert(
      21,
      'POST /api/communications/send dispatches, logs simulated activity & marks sandbox',
      validSendRes.status === 200 &&
        validSendData.success === true &&
        validSendData.result?.simulated === true &&
        validSendData.activity &&
        validSendData.activity.type === 'communication_sent' &&
        validSendData.activity.channel === 'email' &&
        validSendData.activity.humanApproved === true &&
        validSendData.activity.title.includes('[Sandbox Simulated]'),
      `Activity ID: ${validSendData.activity?._id || validSendData.activity?.id}, Title: "${validSendData.activity?.title}"`
    )

    // I. Secret protection verification in activity & result
    const serializedOutput = JSON.stringify({
      result: validSendData.result,
      activity: validSendData.activity,
    }).toLowerCase()
    const hasSecrets =
      serializedOutput.includes('smtp_pass') ||
      serializedOutput.includes('auth_token') ||
      serializedOutput.includes('secret')
    assert(
      22,
      'Activity & Response Secret Sanitization',
      hasSecrets === false,
      'No passwords, auth tokens, or secrets exposed in API responses or activity logs'
    )

    // J. Missing email subject validation
    const missingSubjectRes = await fetch(`${BASE_URL}/communications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        leadId,
        channel: 'email',
        recipient: 'marcus@vanceenterprises.com',
        content: 'Content with missing subject',
        humanApproved: true,
      }),
    })
    assert(
      23,
      'POST /api/communications/send validates required subject for email',
      missingSubjectRes.status === 400,
      `Status: ${missingSubjectRes.status}`
    )

    // K. Missing content validation
    const missingContentRes = await fetch(`${BASE_URL}/communications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        leadId,
        channel: 'sms',
        recipient: '+14155558833',
        content: '   ',
        humanApproved: true,
      }),
    })
    assert(
      24,
      'POST /api/communications/send validates non-empty message content',
      missingContentRes.status === 400,
      `Status: ${missingContentRes.status}`
    )

    // L. Multi-tenant cross-user authorization protection
    const rogueUserPayload = {
      email: `rogue_user_${Date.now()}@bizflow.ai`,
      password: 'SecurePassword123!',
      name: 'Rogue User',
    }
    const rogueReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rogueUserPayload),
    })
    const rogueData = await rogueReg.json()
    const rogueToken = rogueData.token

    if (rogueToken) {
      const crossUserDraftRes = await fetch(`${BASE_URL}/communications/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rogueToken}`,
        },
        body: JSON.stringify({
          leadId, // belongs to user 1
          channel: 'email',
        }),
      })
      assert(
        25,
        'Multi-Tenant Authorization Guard (Cross-User Lead Access Rejected)',
        crossUserDraftRes.status === 404,
        `Status: ${crossUserDraftRes.status} (Unauthorized cross-user access rejected)`
      )
    }
  }

  console.log('\n------------------------------------------------------------------')
  console.log(`STEP 20 RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`)
  console.log('------------------------------------------------------------------\n')

  return results
}

// Allow direct execution: node backend/tests/step20Communications.test.js
if (process.argv[1]?.includes('step20Communications.test.js')) {
  runStep20Tests()
    .then((results) => {
      if (results.failed.length > 0) {
        process.exit(1)
      } else {
        process.exit(0)
      }
    })
    .catch((err) => {
      console.error('Fatal test error:', err)
      process.exit(1)
    })
}
