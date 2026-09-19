import { formatDate } from '../utils/dates.js'

export const FIXED_MVP_WORKFLOW_STEPS = [
  'New Lead',
  'Analyze Lead',
  'Save Analysis to CRM Lead',
  'Create Follow-Up Task',
  'Record Activity',
]

export const WORKFLOW_SAFETY_METADATA = {
  aiProvider: 'Not connected',
  executionMode: 'Mock / Configuration Only',
  humanReview: 'Required',
  externalActions: 'Not enabled',
  notice:
    'No real AI provider is connected yet. No WhatsApp, Email, or SMS messages are sent. No autonomous external actions are performed. Workflow execution is currently simulated/frontend-only. AI-generated analysis will require human review.',
}

export const defaultMockExecutions = [
  {
    id: 'run-1',
    leadName: 'Asha Mehta',
    leadCompany: 'Mehta Studio',
    timestamp: 'Today, 9:15 AM',
    status: 'Succeeded',
    stepsReached: 5,
    stepResults: [
      { name: 'New Lead', status: 'Completed', detail: 'Inbound lead Asha Mehta captured and saved to CRM.' },
      { name: 'Analyze Lead', status: 'Completed', detail: 'Sales Agent analyzed business fit and response urgency.' },
      { name: 'Save Analysis to CRM Lead', status: 'Completed', detail: 'Saved reviewable analysis and suggested next step.' },
      { name: 'Create Follow-Up Task', status: 'Completed', detail: 'Created task: Review lead and follow up.' },
      { name: 'Record Activity', status: 'Completed', detail: 'Logged timeline activity for workspace team.' },
    ],
  },
  {
    id: 'run-2',
    leadName: 'Kenji Sato',
    leadCompany: 'Sato Co.',
    timestamp: 'Today, 2:15 AM',
    status: 'Failed',
    stepsReached: 2,
    failedStep: 'Analyze Lead',
    failureReason: 'Mock analysis failed. The lead was safely preserved in CRM without data loss.',
    stepResults: [
      { name: 'New Lead', status: 'Completed', detail: 'Lead Kenji Sato saved first. Data is safe.' },
      { name: 'Analyze Lead', status: 'Failed', detail: 'Mock analysis failure recorded for human review.' },
      { name: 'Save Analysis to CRM Lead', status: 'Skipped', detail: 'Skipped because analysis did not succeed.' },
      { name: 'Create Follow-Up Task', status: 'Skipped', detail: 'Skipped to avoid creating inaccurate follow-up data.' },
      { name: 'Record Activity', status: 'Completed', detail: 'Failure recorded in activity log for manual user action.' },
    ],
  },
]

export function createWorkflowRecord(fields, options = {}) {
  const now = options.createdAt ? new Date(options.createdAt) : new Date()
  const id = options.id || `wf-${now.getTime()}`
  const createdLabel = formatDate(now)
  const lastExecution = options.lastExecution || 'Today, 9:15 AM'
  const executionStatus = options.executionStatus || 'Succeeded'
  const steps = fields.steps || [...FIXED_MVP_WORKFLOW_STEPS]
  const executions = options.executions || defaultMockExecutions

  return {
    id,
    name: fields.name.trim(),
    description: fields.description.trim(),
    status: fields.status || 'Active',
    trigger: fields.trigger || 'New Lead Created',
    agent: fields.agent || 'Sales Agent',
    steps,
    createdAt: now.toISOString(),
    createdLabel,
    lastExecution,
    executionStatus,
    executions,
    aiProvider: WORKFLOW_SAFETY_METADATA.aiProvider,
    executionMode: WORKFLOW_SAFETY_METADATA.executionMode,
    humanReview: WORKFLOW_SAFETY_METADATA.humanReview,
    externalActions: WORKFLOW_SAFETY_METADATA.externalActions,
  }
}

export const initialWorkflows = [
  createWorkflowRecord(
    {
      name: 'New Lead Follow-Up',
      description:
        'Automatically processes a newly created lead, prepares an AI-assisted analysis, updates the lead record, creates a follow-up task, and records the activity for human review.',
      status: 'Active',
      trigger: 'New Lead Created',
      agent: 'Sales Agent',
      steps: FIXED_MVP_WORKFLOW_STEPS,
    },
    {
      id: 'wf-new-lead',
      createdAt: '2026-09-18T08:00:00.000Z',
      lastExecution: 'Today, 9:15 AM',
      executionStatus: 'Succeeded',
      executions: defaultMockExecutions,
    },
  ),
]
