import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  accountInfoData,
  aiSafetySettingsData,
  initialPreferences,
  initialProfile,
  securitySettingsData,
  workspaceSettingsData,
} from '../data/settingsData.js'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [profile, setProfile] = useState(initialProfile)
  const [preferences, setPreferences] = useState(initialPreferences)

  const updateProfile = useCallback((fields) => {
    const updated = {
      name: fields.name.trim(),
      email: fields.email.trim(),
      phone: fields.phone ? fields.phone.trim() : '',
      company: fields.company ? fields.company.trim() : '',
    }
    setProfile(updated)
    return updated
  }, [])

  const togglePreference = useCallback((key) => {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }))
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
    }),
    [profile, updateProfile, preferences, togglePreference],
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
