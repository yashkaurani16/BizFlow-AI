import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  activeWorkflow,
  dashboardStats,
  dashboardUser,
  emptyDashboard,
  leadStatusOverview,
  quickActions,
  recentActivities,
} from '../data/dashboardData.js'
import { dashboardApi } from '../services/api.js'

const populatedDashboard = {
  user: dashboardUser,
  stats: dashboardStats,
  leadStatusOverview,
  recentActivities,
  activeWorkflow,
  quickActions,
}

function loadMockDashboard(state) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (state === 'error') {
        reject(new Error('Unable to load dashboard data. Please try again.'))
        return
      }

      if (state === 'empty') {
        resolve(emptyDashboard)
        return
      }

      resolve(populatedDashboard)
    }, 250)
  })
}

export function useDashboardData() {
  const [searchParams] = useSearchParams()
  const demoState = searchParams.get('state')
  const [status, setStatus] = useState('loading')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const retry = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError('')

    async function fetchData() {
      // If explicit query state demo is requested, respect it
      if (demoState) {
        try {
          const result = await loadMockDashboard(demoState)
          if (!cancelled) {
            setData(result)
            setStatus('success')
          }
        } catch (err) {
          if (!cancelled) {
            setData(null)
            setError(err.message)
            setStatus('error')
          }
        }
        return
      }

      // Try live dashboard API
      try {
        const res = await dashboardApi.getMetrics()
        if (!cancelled && res && res.success && res.metrics) {
          const metrics = res.metrics
          const liveData = {
            user: dashboardUser,
            stats: [
              {
                id: 'totalLeads',
                label: 'Total Leads',
                value: metrics.totalLeads,
                subtext: `${metrics.pipeline?.New || 0} new pipeline`,
                tone: 'default',
              },
              {
                id: 'activeAgents',
                label: 'Active AI Agents',
                value: metrics.activeAgents,
                subtext: 'Operational agents',
                tone: 'success',
              },
              {
                id: 'activeWorkflows',
                label: 'Active Workflows',
                value: metrics.activeWorkflows,
                subtext: 'Fixed follow-up workflow',
                tone: 'default',
              },
              {
                id: 'followUpTasks',
                label: 'Follow-Up Tasks',
                value: metrics.followUpTasks,
                subtext: 'Pending review',
                tone: 'warning',
              },
            ],
            leadStatusOverview: [
              { id: 'new', label: 'New', count: metrics.pipeline?.New || 0 },
              { id: 'contacted', label: 'Contacted', count: metrics.pipeline?.Contacted || 0 },
              { id: 'qualified', label: 'Qualified', count: metrics.pipeline?.Qualified || 0 },
              { id: 'converted', label: 'Converted', count: metrics.pipeline?.Converted || 0 },
              { id: 'lost', label: 'Lost', count: metrics.pipeline?.Lost || 0 },
            ],
            recentActivities:
              metrics.recentActivities && metrics.recentActivities.length > 0
                ? metrics.recentActivities.map((a) => ({
                    id: a._id || a.id || String(Math.random()),
                    type: a.type || 'system',
                    title: a.title,
                    description: a.description,
                    time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
                    status: a.status || 'Active',
                  }))
                : recentActivities,
            activeWorkflow,
            quickActions,
          }
          setData(liveData)
          setStatus('success')
          return
        }
      } catch (apiErr) {
        console.warn('[useDashboardData] API fetch failed, falling back to mock:', apiErr.message)
      }

      // Safe fallback to mock dashboard if API unavailable
      try {
        const fallback = await loadMockDashboard('default')
        if (!cancelled) {
          setData(fallback)
          setStatus('success')
        }
      } catch (mockErr) {
        if (!cancelled) {
          setError(mockErr.message)
          setStatus('error')
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [demoState, reloadKey])

  const isEmpty =
    status === 'success' &&
    data &&
    (!data.stats.find((item) => item.id === 'totalLeads')?.value || data.recentActivities.length === 0)

  return { status, data, error, isEmpty, retry }
}
