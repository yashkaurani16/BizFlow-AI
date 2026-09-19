/**
 * Dedicated Backend AI Service for BizFlow AI
 * Exposes core operations: analyzeLead, generateFollowUpSuggestion, generateSupportDraft, generateMarketingSuggestion.
 * Enforces strict safety boundaries: no autonomous external actions; all output flagged for Human Review.
 */

import {
  executeAIRequest,
  generateFallbackAnalysis,
  getProviderConfig,
} from './providerAdapter.js'

const SYSTEM_SAFETY_PREAMBLE = `You are an internal business automation assistant for BizFlow AI.
SAFETY RESTRICTIONS:
- You DO NOT have permission to perform autonomous external actions.
- You CANNOT send emails, WhatsApp messages, SMS, or social media posts.
- You CANNOT conduct financial transactions or contact customers directly.
- All output is strictly advisory for HUMAN REVIEW.
- You MUST respond ONLY with valid JSON.`

/**
 * Returns current status of backend AI provider integration.
 */
export function getAIProviderStatus() {
  const config = getProviderConfig()
  return {
    isConfigured: config.isConfigured,
    provider: config.isConfigured ? config.provider : 'Not connected',
    model: config.isConfigured ? config.model : 'bounded-fallback-v1',
    status: config.isConfigured ? 'AI Provider Connected' : 'AI Provider Unavailable — Fallback Analysis',
    humanReviewRequired: true,
    safetyPolicy: 'Strictly bounded analysis; no autonomous external messaging or mutations.',
  }
}

/**
 * Primary MVP AI Operation: Analyze Inbound Lead
 * Evaluates lead fit, quality tier, and suggested next step using agent instructions.
 */
export async function analyzeLead(lead, agent) {
  const agentName = agent?.name || 'Sales Agent'
  const agentInstructions =
    agent?.instructions ||
    'Analyze inbound business leads, assess qualification level, and suggest appropriate follow-up actions.'

  const systemPrompt = `${SYSTEM_SAFETY_PREAMBLE}

ROLE: You are acting as ${agentName}.
AGENT INSTRUCTIONS:
${agentInstructions}

TASK:
Analyze the provided inbound business lead. Evaluate business fit, assign a lead quality rating (High, Medium, or Low), and propose a single, professional suggested next step for a human sales representative.

OUTPUT FORMAT (strictly JSON):
{
  "summary": "Brief 1-2 sentence executive assessment of the lead and qualification level.",
  "leadQuality": "High" | "Medium" | "Low",
  "suggestedNextStep": "Specific, actionable follow-up step for the human rep.",
  "reasoningSummary": "1 sentence explaining the key factors driving this assessment."
}`

  const userPrompt = `LEAD DETAILS:
- Name: ${lead.name}
- Email: ${lead.email}
- Company: ${lead.company || 'Direct individual'}
- Phone: ${lead.phone || 'Not provided'}
- Status: ${lead.status || 'New'}
- Budget: ${lead.budget || 'Unspecified'}
- Project Timeline: ${lead.projectTimeline || 'Unspecified'}
- Notes: ${lead.notes || 'None'}`

  const fallbackFn = () => generateFallbackAnalysis(lead, agent)

  const response = await executeAIRequest({
    systemPrompt,
    userPrompt,
    fallbackFn,
  })

  return response.result
}

/**
 * Secondary Operation: Generate Follow-Up Suggestion
 */
export async function generateFollowUpSuggestion(lead) {
  const systemPrompt = `${SYSTEM_SAFETY_PREAMBLE}
TASK: Generate a concise, professional follow-up action title and description for a human team member.
OUTPUT FORMAT (JSON):
{
  "title": "Action title",
  "description": "Action details",
  "recommendedTiming": "e.g. Within 24 hours"
}`

  const userPrompt = `Lead: ${lead.name} (${lead.company || 'Direct'}). Notes: ${lead.notes || 'Inbound inquiry'}.`

  const fallbackFn = () => ({
    title: `Follow up with ${lead.name}`,
    description: `Review inbound inquiry and send introduction to ${lead.company || lead.name}.`,
    recommendedTiming: 'Within 24 hours',
    isRealAI: false,
    humanReviewRequired: true,
  })

  const response = await executeAIRequest({ systemPrompt, userPrompt, fallbackFn })
  return response.result
}

/**
 * Secondary Operation: Generate Customer Support Draft
 */
export async function generateSupportDraft(input) {
  const customerQuery = typeof input === 'string' ? input : input?.query || ''
  const systemPrompt = `${SYSTEM_SAFETY_PREAMBLE}
TASK: Draft a polite, helpful customer support response for human review before sending.
OUTPUT FORMAT (JSON):
{
  "draft": "Draft response text",
  "keyPoints": ["Point 1", "Point 2"],
  "suggestedTone": "Professional & Empathetic"
}`

  const fallbackFn = () => ({
    draft: `Hello, thank you for reaching out to BizFlow AI. We have received your query regarding "${customerQuery.slice(0, 50)}..." and our support team is reviewing it. We will follow up shortly.`,
    keyPoints: ['Acknowledge request', 'Set expectation for human review'],
    suggestedTone: 'Professional & Empathetic',
    isRealAI: false,
    humanReviewRequired: true,
  })

  const response = await executeAIRequest({
    systemPrompt,
    userPrompt: `Customer Query: ${customerQuery}`,
    fallbackFn,
  })
  return response.result
}

/**
 * Secondary Operation: Generate Marketing Suggestion
 */
export async function generateMarketingSuggestion(input) {
  const topic = typeof input === 'string' ? input : input?.topic || ''
  const systemPrompt = `${SYSTEM_SAFETY_PREAMBLE}
TASK: Suggest tailored marketing nurture angles and email subject lines for human review.
OUTPUT FORMAT (JSON):
{
  "subjectLines": ["Subject 1", "Subject 2"],
  "valueProposition": "Core message",
  "callToAction": "Recommended CTA"
}`

  const fallbackFn = () => ({
    subjectLines: [
      'Streamline your business workflows with BizFlow AI',
      'Save hours every week with automated lead triage',
    ],
    valueProposition: 'Centralize lead management and follow-up tasks in one bounded platform.',
    callToAction: 'Schedule a discovery demonstration',
    isRealAI: false,
    humanReviewRequired: true,
  })

  const response = await executeAIRequest({
    systemPrompt,
    userPrompt: `Marketing Topic / Campaign: ${topic}`,
    fallbackFn,
  })
  return response.result
}

export default {
  getAIProviderStatus,
  analyzeLead,
  generateFollowUpSuggestion,
  generateSupportDraft,
  generateMarketingSuggestion,
}
