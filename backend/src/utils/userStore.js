import mongoose from 'mongoose'
import User from '../models/User.js'

// In-memory development store used when MongoDB daemon is offline
const devUsersById = new Map()
const devUsersByEmail = new Map()

/**
 * Strips passwordHash and returns safe user profile object.
 */
export const toSafeUser = (user) => {
  if (!user) return null

  const raw = typeof user.toObject === 'function' ? user.toObject() : user
  const { passwordHash, __v, ...safe } = raw
  return safe
}

/**
 * Find a user document by email.
 * Checks MongoDB if connected; otherwise falls back to development memory store.
 */
export const findUserByEmail = async (email) => {
  if (!email) return null
  const normalizedEmail = email.trim().toLowerCase()

  if (mongoose.connection.readyState === 1) {
    return await User.findOne({ email: normalizedEmail })
  }

  return devUsersByEmail.get(normalizedEmail) || null
}

/**
 * Find a safe user document by ID.
 */
export const findUserById = async (id) => {
  if (!id) return null
  const idStr = id.toString()

  if (mongoose.connection.readyState === 1) {
    return await User.findById(idStr).select('-passwordHash')
  }

  const user = devUsersById.get(idStr)
  return user ? toSafeUser(user) : null
}

/**
 * Creates and persists a user.
 * Validates against Mongoose schema rules.
 */
export const createUser = async ({ name, email, passwordHash, phone = '', company = '' }) => {
  const normalizedEmail = email.trim().toLowerCase()

  // Validate using Mongoose schema
  const userDoc = new User({
    name,
    email: normalizedEmail,
    passwordHash,
    phone,
    company,
  })

  await userDoc.validate()

  if (mongoose.connection.readyState === 1) {
    const saved = await userDoc.save()
    return saved
  }

  // Fallback in-memory persistence when MongoDB is offline
  const now = new Date()
  userDoc._id = userDoc._id || new mongoose.Types.ObjectId()
  userDoc.createdAt = now
  userDoc.updatedAt = now

  devUsersById.set(userDoc._id.toString(), userDoc)
  devUsersByEmail.set(normalizedEmail, userDoc)

  return userDoc
}

export default {
  toSafeUser,
  findUserByEmail,
  findUserById,
  createUser,
}
