/**
 * Dedicated Resend Email Provider for BizFlow AI
 * Uses official 'resend' SDK to send real emails when RESEND_API_KEY is configured.
 * Server-side only: never logs, exposes, or leaks RESEND_API_KEY.
 */

import { Resend } from 'resend'

export const DEFAULT_RESEND_FROM = 'onboarding@resend.dev'

let cachedClient = null
let cachedKey = null

/**
 * Returns a configured Resend SDK instance or null if unconfigured
 */
export function getResendClient(apiKeyOverride) {
  const apiKey = (apiKeyOverride || process.env.RESEND_API_KEY || '').trim()
  if (!apiKey) {
    return null
  }
  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new Resend(apiKey)
    cachedKey = apiKey
  }
  return cachedClient
}

/**
 * Checks if Resend is configured via RESEND_API_KEY
 */
export function isResendConfigured() {
  return Boolean((process.env.RESEND_API_KEY || '').trim())
}

/**
 * Sends a real email via Resend
 * Supports HTML and text message bodies, custom or default sender, and custom client injection.
 */
export async function sendEmailWithResend({
  recipient,
  subject,
  content,
  from = DEFAULT_RESEND_FROM,
  clientOverride = null,
}) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim()
  if (!apiKey && !clientOverride) {
    const err = new Error('RESEND_API_KEY is not configured.')
    err.code = 'RESEND_NOT_CONFIGURED'
    throw err
  }

  const client = clientOverride || getResendClient(apiKey)
  const sender = from || DEFAULT_RESEND_FROM

  // Format content: provide rich HTML with text fallback
  const htmlContent = content.includes('<') && content.includes('>')
    ? content
    : `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b;">${content.replace(/\n/g, '<br/>')}</div>`

  try {
    const { data, error } = await client.emails.send({
      from: sender,
      to: [recipient],
      subject: subject.trim(),
      text: content.trim(),
      html: htmlContent,
    })

    if (error) {
      // Strip potential key or secret strings from the error message
      const sanitizedMsg = (error.message || 'Resend delivery error').replace(/re_[a-zA-Z0-9_-]+/g, 're_***')
      const deliveryErr = new Error(`Resend email delivery failed: ${sanitizedMsg}`)
      deliveryErr.code = error.name || 'RESEND_API_ERROR'
      deliveryErr.statusCode = error.statusCode || 502
      throw deliveryErr
    }

    return {
      success: true,
      channel: 'email',
      provider: 'resend',
      mode: 'live',
      simulated: false,
      messageId: data?.id || `resend_${Date.now()}`,
      sender,
      recipient,
      subject: subject.trim(),
      deliveredAt: new Date().toISOString(),
      status: 'delivered',
    }
  } catch (err) {
    const sanitizedMsg = (err.message || 'Resend provider error').replace(/re_[a-zA-Z0-9_-]+/g, 're_***')
    const providerErr = new Error(sanitizedMsg)
    providerErr.code = err.code || 'RESEND_PROVIDER_ERROR'
    providerErr.statusCode = err.statusCode || 502
    providerErr.channel = 'email'
    throw providerErr
  }
}

export default {
  DEFAULT_RESEND_FROM,
  getResendClient,
  isResendConfigured,
  sendEmailWithResend,
}
