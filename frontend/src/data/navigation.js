export const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leads', label: 'Leads' },
  { to: '/agents', label: 'AI Agents' },
  { to: '/workflows', label: 'Workflows' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Profile & Settings' },
]

export const pageTitles = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/leads/new': 'Add lead',
  '/agents': 'AI Agents',
  '/agents/new': 'Create agent',
  '/workflows': 'Workflow Automation',
  '/workflows/new': 'Create workflow',
  '/analytics': 'Analytics',
  '/settings': 'Profile & Settings',
}

export function getPageTitle(pathname) {
  if (pageTitles[pathname]) {
    return pageTitles[pathname]
  }

  if (/^\/leads\/[^/]+\/edit$/.test(pathname)) {
    return 'Edit lead'
  }

  if (/^\/leads\/[^/]+$/.test(pathname)) {
    return 'Lead details'
  }

  if (/^\/agents\/[^/]+\/edit$/.test(pathname)) {
    return 'Edit agent'
  }

  if (/^\/agents\/[^/]+$/.test(pathname)) {
    return 'Agent details'
  }

  if (/^\/workflows\/[^/]+\/edit$/.test(pathname)) {
    return 'Edit workflow'
  }

  if (/^\/workflows\/[^/]+$/.test(pathname)) {
    return 'Workflow details'
  }

  return 'BizFlow AI'
}
