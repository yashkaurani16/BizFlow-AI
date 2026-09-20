import mongoose from 'mongoose'

const devLeads = new Map()
const devTasks = new Map()
const devActivities = new Map()
const devExecutions = new Map()
const devAgents = new Map()
const devWorkflows = new Map()

export const defaultMvpAgents = [
  {
    name: 'Sales Agent',
    type: 'Sales',
    description: 'Evaluates new leads, assesses qualification level, and suggests appropriate follow-up actions.',
    instructions: 'Analyze inbound business leads, assess budget and timeline, and generate initial outreach strategy.',
    status: 'Active',
  },
  {
    name: 'Customer Support Agent',
    type: 'Customer Support',
    description: 'Handles support questions and drafts professional resolution responses.',
    instructions: 'Identify key pain points in customer messages, propose clear troubleshooting steps, and maintain a polite tone.',
    status: 'Active',
  },
  {
    name: 'Marketing Agent',
    type: 'Marketing',
    description: 'Drafts tailored nurture messaging, marketing emails, and campaign follow-ups.',
    instructions: 'Create engaging marketing messages highlighting product value propositions and clear call-to-actions.',
    status: 'Inactive',
  },
]

export const defaultMvpWorkflow = {
  name: 'New Lead Follow-Up',
  description: 'Fixed MVP sequence: Analyze lead upon creation, save AI notes, create follow-up task, and record activity.',
  trigger: 'New Lead Created',
  status: 'Active',
  isVisualWorkflow: true,
  steps: [
    { stepNumber: 1, action: 'Lead Captured', description: 'Inbound lead received in CRM' },
    { stepNumber: 2, action: 'AI Lead Qualification', description: 'Sales agent assesses intent, budget, and fit' },
    { stepNumber: 3, action: 'Update CRM Record', description: 'Store AI analysis and recommended next steps' },
    { stepNumber: 4, action: 'Create Follow-Up Task', description: 'Assign prioritized task to sales owner' },
    { stepNumber: 5, action: 'Record Activity', description: 'Log event in activity audit trail' },
  ],
  nodes: [
    {
      id: 'node_trigger',
      type: 'trigger_new_lead',
      label: 'New Lead Trigger',
      category: 'trigger',
      position: { x: 60, y: 150 },
      config: { triggerEvent: 'lead_created' },
    },
    {
      id: 'node_analyze',
      type: 'ai_analyze_lead',
      label: 'Analyze Lead Fit',
      category: 'ai',
      position: { x: 320, y: 150 },
      config: { model: 'gemini-1.5-flash', temperature: 0.2 },
    },
    {
      id: 'node_update_crm',
      type: 'crm_update_lead',
      label: 'Update CRM Record',
      category: 'crm',
      position: { x: 580, y: 150 },
      config: { updateFields: ['aiScore', 'aiSummary', 'priority'] },
    },
    {
      id: 'node_task',
      type: 'crm_create_task',
      label: 'Create Follow-Up Task',
      category: 'crm',
      position: { x: 840, y: 150 },
      config: { taskTitle: 'Follow up with lead', priority: 'High', dueInHours: 24 },
    },
    {
      id: 'node_activity',
      type: 'crm_record_activity',
      label: 'Record Activity',
      category: 'crm',
      position: { x: 1100, y: 150 },
      config: { activityType: 'Workflow Step', status: 'Completed' },
    },
  ],
  edges: [
    { id: 'edge_1_2', source: 'node_trigger', target: 'node_analyze', label: 'On Capture' },
    { id: 'edge_2_3', source: 'node_analyze', target: 'node_update_crm', label: 'Analyzed' },
    { id: 'edge_3_4', source: 'node_update_crm', target: 'node_task', label: 'Updated' },
    { id: 'edge_4_5', source: 'node_task', target: 'node_activity', label: 'Task Created' },
  ],
}

export const getDevUserLeads = (userId) => {
  const uid = userId.toString()
  if (!devLeads.has(uid)) devLeads.set(uid, [])
  return devLeads.get(uid)
}

export const getDevUserTasks = (userId) => {
  const uid = userId.toString()
  if (!devTasks.has(uid)) devTasks.set(uid, [])
  return devTasks.get(uid)
}

export const getDevUserActivities = (userId) => {
  const uid = userId.toString()
  if (!devActivities.has(uid)) devActivities.set(uid, [])
  return devActivities.get(uid)
}

export const getDevUserExecutions = (userId) => {
  const uid = userId.toString()
  if (!devExecutions.has(uid)) devExecutions.set(uid, [])
  return devExecutions.get(uid)
}

export const getDevUserAgents = (userId) => {
  const uid = userId.toString()
  if (!devAgents.has(uid)) {
    const seeded = defaultMvpAgents.map((a) => ({
      _id: new mongoose.Types.ObjectId(),
      ...a,
      owner: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
    devAgents.set(uid, seeded)
  }
  return devAgents.get(uid)
}

export const getDevUserWorkflows = (userId) => {
  const uid = userId.toString()
  if (!devWorkflows.has(uid)) {
    const agents = getDevUserAgents(userId)
    const salesAgent = agents.find((a) => a.type === 'Sales')
    const seeded = [
      {
        _id: new mongoose.Types.ObjectId(),
        ...defaultMvpWorkflow,
        owner: userId,
        assignedAgent: salesAgent ? salesAgent._id : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    devWorkflows.set(uid, seeded)
  }
  return devWorkflows.get(uid)
}

export const deleteDevUserWorkflow = (userId, workflowId) => {
  const workflows = getDevUserWorkflows(userId)
  const index = workflows.findIndex((w) => w._id.toString() === workflowId.toString())
  if (index === -1) return false
  workflows.splice(index, 1)
  return true
}

export const resetDevUserWorkflows = (userId) => {
  if (userId) {
    devWorkflows.delete(userId.toString())
  } else {
    devWorkflows.clear()
  }
}

export default {
  defaultMvpAgents,
  defaultMvpWorkflow,
  getDevUserLeads,
  getDevUserTasks,
  getDevUserActivities,
  getDevUserExecutions,
  getDevUserAgents,
  getDevUserWorkflows,
  deleteDevUserWorkflow,
  resetDevUserWorkflows,
}
