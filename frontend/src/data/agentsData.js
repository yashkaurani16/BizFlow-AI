import { formatDate } from '../utils/dates.js'

export const AI_TRANSPARENCY_METADATA = {
  provider: 'Not connected',
  status: 'Mock / Configuration Only',
  humanReview: 'Required',
  notice:
    'AI provider is not connected yet. Agent configuration is currently mock/frontend-only. AI-generated results will require human review. No autonomous external messaging or actions are implemented.',
}

export function createAgentRecord(fields, options = {}) {
  const now = options.createdAt ? new Date(options.createdAt) : new Date()
  const id = options.id || `agent-${now.getTime()}`
  const createdLabel = formatDate(now)
  const lastActivity = options.lastActivity || 'Today, 9:15 AM'

  return {
    id,
    name: fields.name.trim(),
    type: fields.type,
    description: fields.description.trim(),
    instructions: fields.instructions.trim(),
    status: fields.status || 'Active',
    createdAt: now.toISOString(),
    createdLabel,
    lastActivity,
    aiProvider: AI_TRANSPARENCY_METADATA.provider,
    aiStatus: AI_TRANSPARENCY_METADATA.status,
    humanReview: AI_TRANSPARENCY_METADATA.humanReview,
  }
}

export const initialAgents = [
  createAgentRecord(
    {
      name: 'Sales Agent',
      type: 'Sales',
      description: 'Helps analyze new leads and suggest appropriate follow-up actions.',
      instructions:
        'Analyze inbound leads from the CRM, summarize their requirements and potential business fit, and recommend an appropriate next follow-up action for human review.',
      status: 'Active',
    },
    {
      id: 'agent-sales',
      createdAt: '2026-09-18T08:00:00.000Z',
      lastActivity: 'Today, 9:15 AM',
    },
  ),
  createAgentRecord(
    {
      name: 'Customer Support Agent',
      type: 'Customer Support',
      description:
        'Helps organize customer-support related requests and suggest responses for human review.',
      instructions:
        'Organize customer support queries, categorize issue urgency, draft clear response templates, and flag complex questions for human review.',
      status: 'Active',
    },
    {
      id: 'agent-support',
      createdAt: '2026-09-17T10:30:00.000Z',
      lastActivity: 'Yesterday, 3:45 PM',
    },
  ),
  createAgentRecord(
    {
      name: 'Marketing Agent',
      type: 'Marketing',
      description: 'Helps review marketing-related information and suggest next actions.',
      instructions:
        'Review marketing campaign performance metrics, analyze conversion channel patterns, and propose follow-up campaign ideas for human review.',
      status: 'Active',
    },
    {
      id: 'agent-marketing',
      createdAt: '2026-09-16T14:15:00.000Z',
      lastActivity: 'Sep 18, 11:20 AM',
    },
  ),
]
