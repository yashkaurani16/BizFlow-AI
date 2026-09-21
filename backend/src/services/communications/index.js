/**
 * Master Communication Service Layer for BizFlow AI
 * Orchestrates Email, WhatsApp, and SMS adapters with uniform interfaces.
 * ENFORCES:
 * 1. Provider-agnostic adapter interface: sendMessage(), validateConfiguration(), getProviderStatus()
 * 2. Strict Human Review requirement: no autonomous sending permitted.
 * 3. Server-side only: never logs or leaks secrets.
 */

import emailAdapter from './emailAdapter.js'
import whatsappAdapter from './whatsappAdapter.js'
import smsAdapter from './smsAdapter.js'
import draftService from './draftService.js'
import resendProvider from './resendProvider.js'

const adapters = {
  email: emailAdapter,
  whatsapp: whatsappAdapter,
  sms: smsAdapter,
}

/**
 * Returns adapter for specified channel
 */
export function getAdapter(channel) {
  const normalized = (channel || '').toLowerCase().trim()
  const adapter = adapters[normalized]
  if (!adapter) {
    throw new Error(`Unsupported communication channel: "${channel}". Supported channels are email, whatsapp, and sms.`)
  }
  return adapter
}

/**
 * Returns health and configuration status for all communication providers
 * Guaranteed safe: no credentials returned.
 */
export function getAllProviderStatuses() {
  return {
    email: emailAdapter.getProviderStatus(),
    whatsapp: whatsappAdapter.getProviderStatus(),
    sms: smsAdapter.getProviderStatus(),
    humanReviewPolicy: 'Mandatory explicit human approval required for all external communication.',
  }
}

/**
 * Generates an AI-powered draft for human review
 */
export async function generateDraft(lead, channel, options = {}) {
  return draftService.generateCommunicationDraft(lead, channel, options)
}

/**
 * Sends an external communication after verifying human approval
 */
export async function sendCommunication({
  channel,
  recipient,
  subject,
  content,
  humanApproved,
  isAiGenerated = false,
  metadata = {},
  clientOverride = null,
}) {
  // CRITICAL SAFETY BOUNDARY: Explicit human approval is mandatory
  if (humanApproved !== true) {
    const error = new Error('External communication requires explicit human review and approval before sending.')
    error.code = 'HUMAN_APPROVAL_REQUIRED'
    error.statusCode = 400
    throw error
  }

  const adapter = getAdapter(channel)

  try {
    const result = await adapter.sendMessage({
      recipient,
      subject,
      content,
      metadata,
      clientOverride,
    })

    return {
      ...result,
      humanApproved: true,
      isAiGenerated: Boolean(isAiGenerated),
    }
  } catch (err) {
    // Preserve typed error while ensuring no credentials or stack traces leak
    const sendError = new Error(err.message || 'Failed to dispatch communication.')
    sendError.code = err.code || 'SEND_FAILED'
    sendError.statusCode = err.code === 'INVALID_RECIPIENT' || err.code === 'INVALID_CONTENT' || err.code === 'INVALID_SUBJECT' ? 400 : (err.statusCode || 502)
    sendError.channel = channel
    throw sendError
  }
}

export {
  emailAdapter,
  whatsappAdapter,
  smsAdapter,
  draftService,
  resendProvider,
}

export default {
  getAdapter,
  getAllProviderStatuses,
  generateDraft,
  sendCommunication,
  emailAdapter,
  whatsappAdapter,
  smsAdapter,
  draftService,
  resendProvider,
}
