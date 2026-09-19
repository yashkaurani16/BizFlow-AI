export const dashboardUser = {
  name: 'Yash',
}

export const dashboardStats = [
  {
    id: 'totalLeads',
    label: 'Total Leads',
    value: 128,
    hint: '12 added this week',
    tone: 'info',
    icon: 'leads',
  },
  {
    id: 'activeAgents',
    label: 'Active AI Agents',
    value: 3,
    hint: '3 of 3 types in use',
    tone: 'success',
    icon: 'agents',
  },
  {
    id: 'activeWorkflows',
    label: 'Active Workflows',
    value: 1,
    hint: 'New Lead Follow-Up',
    tone: 'neutral',
    icon: 'workflows',
  },
  {
    id: 'followUpTasks',
    label: 'Follow-up Tasks',
    value: 24,
    hint: '8 due today',
    tone: 'warning',
    icon: 'tasks',
  },
]

export const leadStatusOverview = [
  { status: 'New', count: 42, tone: 'new' },
  { status: 'Contacted', count: 36, tone: 'contacted' },
  { status: 'Qualified', count: 22, tone: 'qualified' },
  { status: 'Converted', count: 18, tone: 'converted' },
  { status: 'Lost', count: 10, tone: 'lost' },
]

export const recentActivities = [
  {
    id: 'act-1',
    type: 'lead_added',
    title: 'New lead added',
    description: 'Asha Mehta was added to CRM with status New.',
    time: 'Today, 9:14 AM',
    status: 'New',
  },
  {
    id: 'act-2',
    type: 'lead_analyzed',
    title: 'Lead analyzed by Sales Agent',
    description: 'Sales Agent saved analysis and a suggested next step for Asha Mehta.',
    time: 'Today, 9:15 AM',
    status: 'Succeeded',
  },
  {
    id: 'act-3',
    type: 'task_created',
    title: 'Follow-up task created',
    description: 'Call Asha Mehta within 24 hours.',
    time: 'Today, 9:15 AM',
    status: 'Active',
  },
  {
    id: 'act-4',
    type: 'status_changed',
    title: 'Lead status changed',
    description: 'Northwind Labs moved from New to Contacted.',
    time: 'Yesterday, 4:32 PM',
    status: 'Contacted',
  },
  {
    id: 'act-5',
    type: 'workflow_executed',
    title: 'Workflow executed',
    description: 'New Lead Follow-Up completed for Northwind Labs.',
    time: 'Yesterday, 4:33 PM',
    status: 'Succeeded',
  },
]

export const activeWorkflow = {
  name: 'New Lead Follow-Up',
  status: 'Active',
  agent: 'Sales Agent',
  lastExecution: 'Today, 9:16 AM',
  executionStatus: 'Succeeded',
  currentStepIndex: 4,
  steps: [
    'New Lead',
    'Analyze Lead',
    'Save Analysis',
    'Create Follow-Up Task',
    'Record Activity',
  ],
}

export const quickActions = [
  { id: 'add-lead', label: '+ Add Lead', to: '/leads/new', variant: 'primary' },
  { id: 'view-leads', label: 'View Leads', to: '/leads', variant: 'secondary' },
  { id: 'manage-agents', label: 'Manage AI Agents', to: '/agents', variant: 'secondary' },
  { id: 'view-workflows', label: 'View Workflows', to: '/workflows', variant: 'secondary' },
  { id: 'view-analytics', label: 'View Analytics', to: '/analytics', variant: 'secondary' },
]

export const emptyDashboard = {
  user: dashboardUser,
  stats: dashboardStats.map((stat) => ({ ...stat, value: 0, hint: 'No data yet' })),
  leadStatusOverview: leadStatusOverview.map((item) => ({ ...item, count: 0 })),
  recentActivities: [],
  activeWorkflow: null,
  quickActions,
}
