import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  accountInfoData,
  aiSafetySettingsData,
  initialPreferences,
  initialProfile,
  securitySettingsData,
  workspaceSettingsData,
} from '../data/settingsData.js'
import { profileApi } from '../services/api.js'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [profile, setProfile] = useState(initialProfile)
  const [preferences, setPreferences] = useState(initialPreferences)
  const [isLoading, setIsLoading] = useState(false)

  // Load profile and preferences from backend API
  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        setIsLoading(true)
        const res = await profileApi.getProfile()
        if (active && res && res.success) {
          if (res.profile) {
            setProfile((prev) => ({
              ...prev,
              name: res.profile.name || prev.name,
              email: res.profile.email || prev.email,
              phone: res.profile.phone !== undefined ? res.profile.phone : prev.phone,
              company: res.profile.company !== undefined ? res.profile.company : prev.company,
            }))
          }
          if (res.preferences) {
            setPreferences((prev) => ({
              ...prev,
              ...res.preferences,
            }))
          }
        }
      } catch (err) {
        console.warn('[SettingsContext] Using initial state (API unavailable or unauthenticated):', err.message)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  const updateProfile = useCallback(async (fields) => {
    const updated = {
      name: fields.name.trim(),
      email: fields.email.trim(),
      phone: fields.phone ? fields.phone.trim() : '',
      company: fields.company ? fields.company.trim() : '',
    }
    setProfile(updated)

    try {
      await profileApi.updateProfile({
        name: updated.name,
        phone: updated.phone,
        company: updated.company,
      })
    } catch (err) {
      console.warn('[SettingsContext] API updateProfile failed, saved locally:', err.message)
    }

    return updated
  }, [])

  const togglePreference = useCallback(async (key) => {
    let nextPref = null
    setPreferences((current) => {
      const next = {
        ...current,
        [key]: !current[key],
      }
      nextPref = next
      return next
    })

    if (nextPref) {
      try {
        await profileApi.updateProfile({ preferences: nextPref })
      } catch (err) {
        console.warn('[SettingsContext] API update preferences failed:', err.message)
      }
    }
  }, [])

  const value = useMemo(
    () => ({
      profile,
      updateProfile,
      preferences,
      togglePreference,
      accountInfo: accountInfoData,
      workspaceInfo: workspaceSettingsData,
      aiSafetySettings: aiSafetySettingsData,
      securityInfo: securitySettingsData,
      isLoading,
    }),
    [profile, updateProfile, preferences, togglePreference, isLoading],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}

export default SettingsContext
