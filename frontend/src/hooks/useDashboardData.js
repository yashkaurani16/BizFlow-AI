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
    }, 450)
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

    loadMockDashboard(demoState)
      .then((result) => {
        if (cancelled) {
          return
        }
        setData(result)
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) {
          return
        }
        setData(null)
        setError(err.message)
        setStatus('error')
      })

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
