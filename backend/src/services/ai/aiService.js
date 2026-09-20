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
Analyze the provided inbound business lead using ONLY the provided CRM details. Do NOT invent any personal or business facts.
Evaluate qualification level, assign a numerical lead score (0 to 100), assign a priority tier (High, Medium, or Low), extract observed key signals from provided data, identify potential risks or missing details, recommend the single best next action, and draft a polite follow-up suggestion for human review.

OUTPUT FORMAT (strictly JSON):
{
  "score": 85,
  "priority": "High" | "Medium" | "Low",
  "summary": "Brief 1-2 sentence executive assessment based strictly on provided lead details.",
  "keySignals": ["Observed signal 1", "Observed signal 2"],
  "risks": ["Risk or missing information 1", "Risk 2"],
  "recommendedNextAction": "Specific, actionable follow-up step for the human rep.",
  "followUpSuggestion": "Draft message or outreach suggestion for the human rep to review and personalize."
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

/**
 * STEP 22: Generate Bounded Advisory AI Insights from Aggregate CRM/Workflow/Communication Data
 * Strictly advisory for human review. Does NOT perform mutations or external calls.
 */
export async function generateAnalyticsInsights(metricsSummary = {}) {
  const {
    totalLeads = 0,
    newLeads = 0,
    qualifiedLeads = 0,
    convertedLeads = 0,
    highPriorityLeads = 0,
    averageAiScore = 0,
    leadsRequiringFollowUp = 0,
    completedTasks = 0,
    pendingTasks = 0,
    activeWorkflows = 0,
    workflowSuccessRate = '100%',
    communicationDrafts = 0,
    humanApprovedSends = 0,
    channelBreakdown = { email: 0, whatsapp: 0, sms: 0 },
  } = metricsSummary

  const systemPrompt = `${SYSTEM_SAFETY_PREAMBLE}

TASK:
Analyze the provided aggregate business metrics for BizFlow AI.
Generate 3 to 5 actionable, data-driven, and strictly advisory business insights.
Do NOT invent unprovided numbers. Rely solely on the provided summary.
All recommendations must be for HUMAN REVIEW and human execution.

OUTPUT FORMAT (JSON array of insight objects):
[
  {
    "title": "Short descriptive title",
    "category": "Pipeline" | "Follow-Up" | "AI Quality" | "Workflows" | "Communications",
    "insight": "1-2 sentence data-grounded observation based on the metrics",
    "supportingMetric": "Specific metric supporting this observation (e.g. '75% Qualified Leads' or '4 Pending Follow-Ups')",
    "recommendedAction": "Concrete action for the human team"
  }
]`

  const userPrompt = `AGGREGATE OPERATIONAL METRICS:
- Total Leads: ${totalLeads} (New: ${newLeads}, Qualified: ${qualifiedLeads}, Converted: ${convertedLeads})
- High Priority AI Leads: ${highPriorityLeads}
- Average AI Lead Score: ${averageAiScore} / 100
- Leads Requiring Follow-Up: ${leadsRequiringFollowUp}
- Tasks: ${pendingTasks} Pending, ${completedTasks} Completed
- Active Workflows: ${activeWorkflows} (Execution Success Rate: ${workflowSuccessRate})
- Communication Drafts: ${communicationDrafts} (Email: ${channelBreakdown.email || 0}, WhatsApp: ${channelBreakdown.whatsapp || 0}, SMS: ${channelBreakdown.sms || 0})
- Human Approved Sandbox Sends: ${humanApprovedSends}`

  const fallbackFn = () => {
    const insights = []

    // 1. Pipeline Insight
    if (totalLeads === 0) {
      insights.push({
        title: 'Lead Pipeline Awaiting Initial Capture',
        category: 'Pipeline',
        insight: 'No leads are currently recorded in the workspace. Adding inbound leads will trigger automated AI qualification.',
        supportingMetric: '0 Total Leads',
        recommendedAction: 'Create or import inbound leads to initiate the automated follow-up workflow.',
      })
    } else if (qualifiedLeads > 0) {
      const qRate = ((qualifiedLeads / totalLeads) * 100).toFixed(0)
      insights.push({
        title: 'Strong Lead Qualification Velocity',
        category: 'Pipeline',
        insight: `${qualifiedLeads} of ${totalLeads} leads (${qRate}%) meet business qualification criteria based on AI assessment.`,
        supportingMetric: `${qRate}% Qualification Rate (${qualifiedLeads}/${totalLeads})`,
        recommendedAction: 'Focus team outreach on qualified leads with high fit scores to optimize conversion.',
      })
    } else {
      insights.push({
        title: 'Inbound Lead Pipeline Active',
        category: 'Pipeline',
        insight: `${newLeads} new leads are queued for review and follow-up.`,
        supportingMetric: `${newLeads} New Leads`,
        recommendedAction: 'Review lead inquiries and execute initial qualification outreach.',
      })
    }

    // 2. Follow-Up & Tasks Insight
    if (pendingTasks > 0 || leadsRequiringFollowUp > 0) {
      insights.push({
        title: 'Actionable Follow-Up Attention Required',
        category: 'Follow-Up',
        insight: `There are ${pendingTasks} pending tasks and ${leadsRequiringFollowUp} leads currently awaiting team response.`,
        supportingMetric: `${pendingTasks} Pending Tasks`,
        recommendedAction: 'Review pending follow-up tasks to maintain prompt response time.',
      })
    } else {
      insights.push({
        title: 'Follow-Up Queue Clear',
        category: 'Follow-Up',
        insight: 'All created follow-up tasks have been addressed or resolved by the team.',
        supportingMetric: `${completedTasks} Tasks Completed`,
        recommendedAction: 'Monitor incoming inquiries for new follow-up opportunities.',
      })
    }

    // 3. AI Quality Insight
    if (averageAiScore > 0) {
      insights.push({
        title: 'AI Qualification Health',
        category: 'AI Quality',
        insight: `Analyzed leads exhibit an average AI fit score of ${averageAiScore}/100, indicating consistent lead fit.`,
        supportingMetric: `Avg Score: ${averageAiScore} (${highPriorityLeads} High Priority)`,
        recommendedAction: 'Prioritize immediate contact with leads scoring above 75.',
      })
    }

    // 4. Communication & Sandbox Insight
    if (communicationDrafts > 0 || humanApprovedSends > 0) {
      insights.push({
        title: 'External Communication Review Compliance',
        category: 'Communications',
        insight: `${communicationDrafts} drafts created with ${humanApprovedSends} human approvals in Development Sandbox mode.`,
        supportingMetric: `${communicationDrafts} Drafts • ${humanApprovedSends} Approved`,
        recommendedAction: 'Review queued communication drafts before simulated or production dispatch.',
      })
    }

    // 5. Workflow Automation Insight
    insights.push({
      title: 'Workflow Automation Reliability',
      category: 'Workflows',
      insight: `${activeWorkflows} active workflow sequences are processing CRM events with a ${workflowSuccessRate} success rate.`,
      supportingMetric: `${activeWorkflows} Active Workflows (${workflowSuccessRate} Success)`,
      recommendedAction: 'Ensure all team triggers and AI agents remain active for automated lead capture.',
    })

    return {
      insights,
      isRealAI: false,
      humanReviewRequired: true,
    }
  }

  const response = await executeAIRequest({
    systemPrompt,
    userPrompt,
    fallbackFn,
  })

  // Normalize response to ensure an array of insights
  let items = []
  if (Array.isArray(response.result)) {
    items = response.result
  } else if (response.result?.insights && Array.isArray(response.result.insights)) {
    items = response.result.insights
  } else if (response.result && typeof response.result === 'object') {
    items = [response.result]
  }

  if (items.length === 0) {
    items = fallbackFn().insights
  }

  return {
    insights: items.map((item) => ({
      title: item.title || 'Operational Observation',
      category: item.category || 'Pipeline',
      insight: item.insight || 'Operational pattern identified from current data.',
      supportingMetric: item.supportingMetric || 'Current metrics',
      recommendedAction: item.recommendedAction || 'Review recommended actions with your team.',
      humanReviewRequired: true,
      isRealAI: Boolean(response.isRealAI),
    })),
    isRealAI: Boolean(response.isRealAI),
    humanReviewRequired: true,
    generatedAt: new Date().toISOString(),
  }
}

export default {
  getAIProviderStatus,
  analyzeLead,
  generateFollowUpSuggestion,
  generateSupportDraft,
  generateMarketingSuggestion,
  generateAnalyticsInsights,
}
