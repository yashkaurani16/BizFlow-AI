import bcrypt from 'bcryptjs'
import { generateToken } from '../utils/token.js'
import { createUser, findUserByEmail, toSafeUser } from '../utils/userStore.js'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone = '', company = '' } = req.body

    // 1. Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
      })
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      })
    }

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      })
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      })
    }

    // 2. Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      })
    }

    // 3. Hash password (never store plaintext)
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // 4. Create and save user document
    const user = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      phone: (phone || '').trim(),
      company: (company || '').trim(),
    })

    // 5. Generate JWT token
    const token = generateToken(user)
    const safeUser = toSafeUser(user)

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: safeUser,
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }
    next(error)
  }
}

/**
 * Log in an existing user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // 1. Validate required fields
    if (!email || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    // 2. Find user by email
    const user = await findUserByEmail(email)
    if (!user) {
      // Return generic failure to prevent account enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    // 3. Compare password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    // 4. Generate JWT token
    const token = generateToken(user)
    const safeUser = toSafeUser(user)

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Log out user
 * POST /api/auth/logout
 * In stateless JWT architecture, client discards the token.
 * Endpoint acknowledges session termination for audit/lifecycle purposes.
 */
export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  })
}

export default {
  register,
  login,
  logout,
  getMe,
}
