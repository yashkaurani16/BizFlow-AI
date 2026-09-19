const TOKEN_KEY = 'bizflow_ai_token'

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch (err) {
    console.error('Error saving token to localStorage:', err)
  }
}

export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch (err) {
    console.error('Error removing token from localStorage:', err)
  }
}

async function request(endpoint, options = {}) {
  const url = `${apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers,
  }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  try {
    const response = await fetch(url, config)
    let data = null

    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok) {
      const errorMsg =
        (data && data.message) ||
        `Request failed with status ${response.status} (${response.statusText})`
      const error = new Error(errorMsg)
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  } catch (err) {
    if (err.status) {
      throw err
    }
    // Network or connection error
    const networkError = new Error(
      `Unable to connect to server at ${apiBaseUrl}. Please ensure the backend is running.`,
    )
    networkError.isNetworkError = true
    throw networkError
  }
}

// Authentication API
export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me', { method: 'GET' }),
}

// Leads / CRM API
export const leadsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams()
    if (params.status && params.status !== 'All') query.append('status', params.status)
    if (params.search) query.append('search', params.search)
    const qs = query.toString()
    return request(`/leads${qs ? `?${qs}` : ''}`, { method: 'GET' })
  },
  getById: (id) => request(`/leads/${id}`, { method: 'GET' }),
  create: (payload) => request('/leads', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/leads/${id}`, { method: 'PUT', body: payload }),
  delete: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
}

// AI Agents API
export const agentsApi = {
  getAll: () => request('/agents', { method: 'GET' }),
  getById: (id) => request(`/agents/${id}`, { method: 'GET' }),
  create: (payload) => request('/agents', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/agents/${id}`, { method: 'PUT', body: payload }),
  delete: (id) => request(`/agents/${id}`, { method: 'DELETE' }),
}

// Workflows API
export const workflowsApi = {
  getAll: () => request('/workflows', { method: 'GET' }),
  getById: (id) => request(`/workflows/${id}`, { method: 'GET' }),
  create: (payload) => request('/workflows', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/workflows/${id}`, { method: 'PUT', body: payload }),
}

// Dashboard API
export const dashboardApi = {
  getMetrics: () => request('/dashboard', { method: 'GET' }),
}

// Analytics API
export const analyticsApi = {
  getAnalytics: (range = 'All Time') =>
    request(`/analytics?range=${encodeURIComponent(range)}`, { method: 'GET' }),
}

// Profile & Settings API
export const profileApi = {
  getProfile: () => request('/profile', { method: 'GET' }),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: payload }),
}

export default {
  getToken,
  setToken,
  removeToken,
  authApi,
  leadsApi,
  agentsApi,
  workflowsApi,
  dashboardApi,
  analyticsApi,
  profileApi,
}
