/**
 * AI-Powered Communication Draft Service for BizFlow AI
 * Leverages Google Gemini (or Bounded Fallback) to craft safe, personalized drafts.
 * CRITICAL SAFETY ENFORCEMENT:
 * - Output is strictly labeled: "AI Generated — Requires Human Review"
 * - Never transmits or sends external communications automatically.
 */

import { executeAIRequest } from '../ai/providerAdapter.js'

const SYSTEM_COMMUNICATION_PREAMBLE = `You are an internal CRM communication assistant for BizFlow AI.
SAFETY RESTRICTIONS:
- You ONLY draft message templates for HUMAN REVIEW and APPROVAL.
- You CANNOT send emails, WhatsApp messages, or SMS directly.
- Base drafts strictly on provided CRM lead information. Do not fabricate facts.
- Do NOT include sensitive personal data or invented terms.
- You MUST respond ONLY with valid JSON.`

/**
 * Fallback draft generator for when the AI provider is unavailable
 */
function generateFallbackDraft(lead, channel) {
  const name = lead.name || 'Valued Contact'
  const company = lead.company ? ` at ${lead.company}` : ''
  const companyMention = lead.company || 'your team'

  if (channel === 'email') {
    return {
      subject: `Connecting regarding workflow automation${company ? ` for ${lead.company}` : ''}`,
      body: `Hi ${name},\n\nThank you for connecting with BizFlow AI. I noticed your interest in automating core operations${company}.\n\nBased on your inquiry, our team can help streamline your lead management and follow-up processes with customized AI workflows.\n\nWould you be open to a brief 15-minute introductory call this week to discuss how we can assist ${companyMention}?\n\nBest regards,\nBizFlow AI Team`,
      keyPoints: ['Acknowledge inquiry', 'Offer 15-min discovery call', 'Focus on workflow automation'],
    }
  }

  if (channel === 'whatsapp') {
    return {
      body: `Hi ${name}! 👋 Thank you for reaching out to BizFlow AI. We saw your inquiry regarding workflow automation${company}. Would you be free for a quick 10-minute chat or call later this week? Let us know what time suits you best!`,
      keyPoints: ['Friendly greeting', 'Reference inquiry', 'Easy low-friction CTA'],
    }
  }

  // SMS
  const shortBody = `Hi ${name}, thank you for contacting BizFlow AI. We'd love to connect regarding your automation needs${company}. Reply YES to schedule a call.`
  return {
    body: shortBody,
    characterCount: shortBody.length,
    keyPoints: ['Concise outreach', 'Reply prompt'],
  }
}

/**
 * Generates an AI draft for Email, WhatsApp, or SMS
 */
export async function generateCommunicationDraft(lead, channel = 'email', options = {}) {
  const normalizedChannel = channel.toLowerCase().trim()
  if (!['email', 'whatsapp', 'sms'].includes(normalizedChannel)) {
    throw new Error(`Unsupported communication channel: "${channel}". Supported channels are email, whatsapp, and sms.`)
  }

  const tone = options.tone || 'professional and courteous'
  const contextNotes = options.customNotes || lead.notes || 'Inbound inquiry via CRM'

  let taskInstructions = ''
  let outputFormat = ''

  if (normalizedChannel === 'email') {
    taskInstructions = `Draft a personalized, high-converting initial follow-up EMAIL for ${lead.name}${lead.company ? ` from ${lead.company}` : ''}. Tone: ${tone}. Include a compelling subject line and clear call-to-action.`
    outputFormat = `{
  "subject": "Compelling subject line",
  "body": "Full email message body with salutation and sign-off",
  "keyPoints": ["Point 1", "Point 2"]
}`
  } else if (normalizedChannel === 'whatsapp') {
    taskInstructions = `Draft a personalized WHATSAPP message for ${lead.name}${lead.company ? ` from ${lead.company}` : ''}. Tone: conversational yet professional. Keep it concise, friendly, and easy to read on mobile.`
    outputFormat = `{
  "body": "WhatsApp message text",
  "keyPoints": ["Point 1", "Point 2"]
}`
  } else {
    // SMS
    taskInstructions = `Draft a concise SMS text message for ${lead.name}${lead.company ? ` (${lead.company})` : ''}. Keep the message strictly under 160 characters while remaining polite and actionable.`
    outputFormat = `{
  "body": "Concise SMS text under 160 characters",
  "characterCount": 120
}`
  }

  const systemPrompt = `${SYSTEM_COMMUNICATION_PREAMBLE}

TASK:
${taskInstructions}

OUTPUT FORMAT (strictly JSON):
${outputFormat}`

  const userPrompt = `LEAD CRM CONTEXT:
- Name: ${lead.name}
- Email: ${lead.email || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}
- Company: ${lead.company || 'Direct'}
- Status: ${lead.status || 'New'}
- Inquiry Notes: ${contextNotes}
- AI Qualification Score: ${lead.score || lead.aiIntelligence?.score || 'N/A'}`

  const fallbackFn = () => generateFallbackDraft(lead, normalizedChannel)

  const aiResponse = await executeAIRequest({
    systemPrompt,
    userPrompt,
    fallbackFn,
  })

  const result = aiResponse.result || generateFallbackDraft(lead, normalizedChannel)

  // Determine recipient suggestion
  const recipient =
    normalizedChannel === 'email'
      ? lead.email || ''
      : lead.phone || ''

  return {
    channel: normalizedChannel,
    recipient,
    subject: normalizedChannel === 'email' ? (result.subject || 'Follow-up from BizFlow AI') : undefined,
    body: result.body || '',
    keyPoints: result.keyPoints || [],
    characterCount: result.body ? result.body.length : 0,
    aiGenerated: true,
    humanReviewRequired: true,
    notice: 'AI Generated — Requires Human Review',
    isFallback: Boolean(aiResponse.isFallback),
    provider: aiResponse.provider || 'fallback',
    model: aiResponse.model || 'bounded-fallback-v1',
  }
}

export default {
  generateCommunicationDraft,
}
