import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, getToken, removeToken, setToken } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Validate session on mount
  useEffect(() => {
    let active = true

    async function checkSession() {
      const storedToken = getToken()
      if (!storedToken) {
        if (active) {
          setIsLoading(false)
        }
        return
      }

      try {
        const res = await authApi.getMe()
        if (active && res && res.success && res.user) {
          setUser(res.user)
          setTokenState(storedToken)
        }
      } catch (err) {
        console.warn('Authentication token expired or invalid:', err.message)
        removeToken()
        if (active) {
          setUser(null)
          setTokenState(null)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password })
    if (res && res.token && res.user) {
      setToken(res.token)
      setTokenState(res.token)
      setUser(res.user)
    }
    return res
  }, [])

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload)
    if (res && res.token && res.user) {
      setToken(res.token)
      setTokenState(res.token)
      setUser(res.user)
    }
    return res
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (err) {
      console.warn('Logout API call failed:', err.message)
    } finally {
      removeToken()
      setTokenState(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
