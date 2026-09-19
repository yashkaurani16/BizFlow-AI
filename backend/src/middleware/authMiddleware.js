import { verifyToken } from '../utils/token.js'
import { findUserById, toSafeUser } from '../utils/userStore.js'

/**
 * Authentication middleware to protect private API endpoints.
 * Requires: Authorization: Bearer <jwt_token>
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required. Format: Bearer <token>',
      })
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing',
      })
    }

    let decoded
    try {
      decoded = verifyToken(token)
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization token',
      })
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Malformed token payload',
      })
    }

    const user = await findUserById(decoded.id)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to token no longer exists',
      })
    }

    // Attach safe user profile to request (never contains passwordHash)
    req.user = toSafeUser(user)
    next()
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication processing failed',
    })
  }
}

export default protect
