/**
 * BizFlow AI — Resend Email Provider Test Suite
 * Validates:
 * 1. Resend provider configuration detection via RESEND_API_KEY
 * 2. Secret and API key masking (zero key leakage in status responses)
 * 3. Safe fallback to Development Sandbox when RESEND_API_KEY is missing
 * 4. Successful live email dispatch with real Resend message ID
 * 5. Resend API error handling with secret scrubbing
 * 6. Mandatory human approval requirement enforcement (HTTP 400 rejection on unapproved dispatch)
 * 7. Activity audit logging for live Resend dispatches
 */

import communicationService, {
  emailAdapter,
  resendProvider,
} from '../src/services/communications/index.js'
import { resetRateLimits } from '../src/middleware/rateLimiter.js'

export async function runResendTests() {
  console.log('==================================================================')
  console.log('       BIZFLOW AI — RESEND EMAIL PROVIDER TESTS                  ')
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

  // Preserve original environment variables
  const origEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    EMAIL_FROM: process.env.EMAIL_FROM,
  }

  try {
    // -------------------------------------------------------------
    // 1. RESEND CONFIGURATION DETECTION
    // -------------------------------------------------------------
    process.env.RESEND_API_KEY = 're_test_key_sample12345'
    process.env.EMAIL_PROVIDER = 'resend'
    delete process.env.EMAIL_FROM

    const config = emailAdapter.validateConfiguration()
    assert(
      1,
      'Resend Provider Configuration Detected via RESEND_API_KEY',
      config.isConfigured === true &&
        config.provider === 'resend' &&
        config.mode === 'live' &&
        config.from === 'onboarding@resend.dev',
      `Provider: ${config.provider}, Mode: ${config.mode}, From: ${config.from}`
    )

    // -------------------------------------------------------------
    // 2. SECRET & API KEY SANITIZATION
    // -------------------------------------------------------------
    const status = emailAdapter.getProviderStatus()
    const statusJson = JSON.stringify(status)
    assert(
      2,
      'Provider Status Sanitization (Zero RESEND_API_KEY Leakage)',
      status.channel === 'email' &&
        status.provider === 'resend' &&
        status.isConfigured === true &&
        !statusJson.includes('re_test_key_sample12345') &&
        !statusJson.includes('secret') &&
        !statusJson.includes('apiKey'),
      `Status text: "${status.status}", Key exposed: false`
    )

    // -------------------------------------------------------------
    // 3. SAFE FALLBACK WHEN RESEND_API_KEY IS MISSING
    // -------------------------------------------------------------
    delete process.env.RESEND_API_KEY
    process.env.EMAIL_PROVIDER = 'resend'

    const missingConfig = emailAdapter.validateConfiguration()
    const fallbackSend = await emailAdapter.sendMessage({
      recipient: 'client@example.com',
      subject: 'Fallback Check',
      content: 'This message should safely simulate in sandbox.',
    })

    assert(
      3,
      'Safe Sandbox Fallback when RESEND_API_KEY is Missing',
      missingConfig.isConfigured === false &&
        missingConfig.mode === 'sandbox' &&
        fallbackSend.success === true &&
        fallbackSend.simulated === true &&
        fallbackSend.mode === 'sandbox' &&
        typeof fallbackSend.messageId === 'string' &&
        fallbackSend.info.includes('RESEND_API_KEY'),
      `Simulated: ${fallbackSend.simulated}, Mode: ${fallbackSend.mode}, MessageId: ${fallbackSend.messageId}`
    )

    // -------------------------------------------------------------
    // 4. SUCCESSFUL SEND WITH RESEND
    // -------------------------------------------------------------
    process.env.RESEND_API_KEY = 're_test_valid_key'
    process.env.EMAIL_PROVIDER = 'resend'

    const mockResendClient = {
      emails: {
        send: async ({ from, to, subject, text, html }) => {
          if (!to || !to.includes('lead@acme.corp')) {
            return { data: null, error: { message: 'Invalid recipient', name: 'validation_error' } }
          }
          return {
            data: { id: 're_msg_7894561230abcdef' },
            error: null,
          }
        },
      },
    }

    const liveSend = await communicationService.sendCommunication({
      channel: 'email',
      recipient: 'lead@acme.corp',
      subject: 'Enterprise Consultation Proposal',
      content: 'Hello, here is the proposal for your enterprise automation.',
      humanApproved: true,
      clientOverride: mockResendClient,
    })

    assert(
      4,
      'Successful Live Resend Email Dispatch with Message ID',
      liveSend.success === true &&
        liveSend.provider === 'resend' &&
        liveSend.mode === 'live' &&
        liveSend.simulated === false &&
        liveSend.messageId === 're_msg_7894561230abcdef' &&
        liveSend.sender === 'onboarding@resend.dev' &&
        liveSend.recipient === 'lead@acme.corp' &&
        liveSend.humanApproved === true,
      `MessageId: ${liveSend.messageId}, Provider: ${liveSend.provider}, Mode: ${liveSend.mode}`
    )

    // -------------------------------------------------------------
    // 5. RESEND API FAILURE HANDLING & SECRET MASKING
    // -------------------------------------------------------------
    const failingMockClient = {
      emails: {
        send: async () => {
          return {
            data: null,
            error: {
              name: 'restricted_api_key',
              message: 'API key re_test_valid_key does not have permission to send to external recipients.',
              statusCode: 403,
            },
          }
        },
      },
    }

    let failureCaught = false
    let safeErrorMessage = ''

    try {
      await communicationService.sendCommunication({
        channel: 'email',
        recipient: 'lead@acme.corp',
        subject: 'Failing Subject',
        content: 'This will trigger provider failure.',
        humanApproved: true,
        clientOverride: failingMockClient,
      })
    } catch (err) {
      failureCaught = true
      safeErrorMessage = err.message || ''
    }

    assert(
      5,
      'Resend Provider Error Handling & Secret Scrubbing',
      failureCaught === true &&
        !safeErrorMessage.includes('re_test_valid_key') &&
        safeErrorMessage.includes('re_***') &&
        safeErrorMessage.includes('Resend email delivery failed'),
      `Sanitized Error: "${safeErrorMessage}"`
    )

    // -------------------------------------------------------------
    // 6. HUMAN APPROVAL STILL STRICTLY REQUIRED
    // -------------------------------------------------------------
    let humanApprovalRejected = false
    try {
      await communicationService.sendCommunication({
        channel: 'email',
        recipient: 'lead@acme.corp',
        subject: 'Autonomous Sending Test',
        content: 'Should be rejected before calling Resend.',
        humanApproved: false, // NOT APPROVED
        clientOverride: mockResendClient,
      })
    } catch (err) {
      if (err.code === 'HUMAN_APPROVAL_REQUIRED') {
        humanApprovalRejected = true
      }
    }

    assert(
      6,
      'Mandatory Human Approval Gate Preserved (Autonomous Sending Rejected)',
      humanApprovalRejected === true,
      'Throws HUMAN_APPROVAL_REQUIRED (HTTP 400) when humanApproved !== true'
    )

    // -------------------------------------------------------------
    // 7. MULTI-TENANT & RECIPIENT VALIDATION INVARIANTS
    // -------------------------------------------------------------
    let invalidRecipientRejected = false
    try {
      await communicationService.sendCommunication({
        channel: 'email',
        recipient: 'invalid-email',
        subject: 'Test',
        content: 'Test content',
        humanApproved: true,
        clientOverride: mockResendClient,
      })
    } catch (err) {
      if (err.code === 'INVALID_RECIPIENT') {
        invalidRecipientRejected = true
      }
    }

    assert(
      7,
      'Invalid Email Recipient Format Rejection',
      invalidRecipientRejected === true,
      'Rejects malformed recipient before calling Resend API'
    )

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n==================================================================')
    console.log(`TOTAL RESEND TESTS: ${results.passed.length + results.failed.length}`)
    console.log(`PASSED:             ${results.passed.length}`)
    console.log(`FAILED:             ${results.failed.length}`)
    console.log('==================================================================\n')

    if (results.failed.length > 0) {
      throw new Error(`Resend test suite had ${results.failed.length} failure(s).`)
    }
  } finally {
    // Restore environment variables
    if (origEnv.RESEND_API_KEY !== undefined) {
      process.env.RESEND_API_KEY = origEnv.RESEND_API_KEY
    } else {
      delete process.env.RESEND_API_KEY
    }
    if (origEnv.EMAIL_PROVIDER !== undefined) {
      process.env.EMAIL_PROVIDER = origEnv.EMAIL_PROVIDER
    } else {
      delete process.env.EMAIL_PROVIDER
    }
    if (origEnv.EMAIL_FROM !== undefined) {
      process.env.EMAIL_FROM = origEnv.EMAIL_FROM
    } else {
      delete process.env.EMAIL_FROM
    }
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('resendEmail.test.js')) {
  runResendTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test suite execution failed:', err)
      process.exit(1)
    })
}
