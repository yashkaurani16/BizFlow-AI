import jwt from 'jsonwebtoken'

/**
 * Generate a signed JWT for an authenticated user.
 * @param {string|Object} user - User ID or user object
 * @returns {string} Signed JWT token
 */
export const generateToken = (user) => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined')
  }

  const userId = typeof user === 'object' && user !== null ? user._id || user.id : user

  return jwt.sign(
    {
      id: userId.toString(),
    },
    secret,
    {
      expiresIn: '7d',
    },
  )
}

/**
 * Verify a JWT and return its decoded payload.
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined')
  }

  return jwt.verify(token, secret)
}

export default {
  generateToken,
  verifyToken,
}
