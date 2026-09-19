import mongoose from 'mongoose'
import { User } from '../models/index.js'
import { findUserById, toSafeUser } from '../utils/userStore.js'

// In-memory dev storage for user preferences
const devPreferences = new Map()

const getDevPreferences = (userId) => {
  const uid = userId.toString()
  if (!devPreferences.has(uid)) {
    devPreferences.set(uid, {
      emailNotifications: true,
      workflowNotifications: true,
      aiActivityNotifications: false,
    })
  }
  return devPreferences.get(uid)
}

/**
 * GET /api/profile
 * Get current authenticated user profile and preferences
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = req.user
    const preferences = getDevPreferences(user._id)

    return res.status(200).json({
      success: true,
      profile: user,
      preferences,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/profile
 * Update user profile and preferences
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { name, phone, company, preferences } = req.body
    const isDbConnected = mongoose.connection.readyState === 1

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty' })
    }

    if (isDbConnected) {
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' })
      }

      if (name !== undefined) user.name = name.trim()
      if (phone !== undefined) user.phone = (phone || '').trim()
      if (company !== undefined) user.company = (company || '').trim()

      await user.save()

      if (preferences) {
        const currentPrefs = getDevPreferences(userId)
        Object.assign(currentPrefs, preferences)
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: toSafeUser(user),
        preferences: getDevPreferences(userId),
      })
    }

    // Offline dev fallback
    const user = await findUserById(userId)
    if (user) {
      if (name !== undefined) user.name = name.trim()
      if (phone !== undefined) user.phone = (phone || '').trim()
      if (company !== undefined) user.company = (company || '').trim()
    }

    if (preferences) {
      const currentPrefs = getDevPreferences(userId)
      Object.assign(currentPrefs, preferences)
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: user,
      preferences: getDevPreferences(userId),
    })
  } catch (error) {
    next(error)
  }
}

export default {
  getProfile,
  updateProfile,
}
