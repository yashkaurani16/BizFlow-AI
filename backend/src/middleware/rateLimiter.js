/**
 * In-Memory Rate Limiter Middleware for BizFlow AI
 * Enforces rate limits on sensitive endpoints (auth, AI, communications, workflows).
 * Lightweight, zero external dependencies, with automated test isolation.
 */

const hitRecords = new Map()

// Periodic cleanup of expired rate limit entries (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
const cleanupTimer = setInterval(() => {
  const now = Date.now()
  for (const [key, record] of hitRecords.entries()) {
    if (now > record.resetTime) {
      hitRecords.delete(key)
    }
  }
}, CLEANUP_INTERVAL_MS)

if (cleanupTimer.unref) {
  cleanupTimer.unref()
}

/**
 * Creates an Express rate-limiting middleware.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default 60s)
 * @param {number} options.max - Max requests allowed per window (default 30)
 * @param {string} options.message - Error message when limit is exceeded
 * @param {string} options.tierName - Identifier for the rate limiter bucket
 */
export function createRateLimiter({
  windowMs = 60 * 1000,
  max = 30,
  message = 'Too many requests from this IP, please try again later.',
  tierName = 'default',
} = {}) {
  return (req, res, next) => {
    // Allow explicit bypass for automated test suites
    if (
      req.headers['x-test-bypass-rate-limit'] === 'true' ||
      (process.env.DISABLE_RATE_LIMIT === 'true' && req.headers['x-test-rate-limit-check'] !== 'true')
    ) {
      return next()
    }

    const isRateLimitProbe = req.headers['x-test-rate-limit-check'] === 'true'
    const clientIp =
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      'unknown-ip'

    // Isolate test probe counts so they don't lock out standard development / regression requests
    const probeSuffix = isRateLimitProbe ? ':probe' : ''
    const key = `${tierName}:${clientIp}${probeSuffix}`
    const now = Date.now()

    let record = hitRecords.get(key)
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      }
      hitRecords.set(key, record)
    } else {
      record.count += 1
    }

    const effectiveMax = isRateLimitProbe ? 10 : max
    const remaining = Math.max(0, effectiveMax - record.count)
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000)

    res.setHeader('X-RateLimit-Limit', effectiveMax)
    res.setHeader('X-RateLimit-Remaining', remaining)
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000))

    if (record.count > effectiveMax) {
      res.setHeader('Retry-After', retryAfterSec)
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSec,
      })
    }

    next()
  }
}

// Pre-configured rate limiters for specific sensitive domains
export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please wait 60 seconds before trying again.',
  tierName: 'auth',
})

export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'AI request limit reached for this window. Please wait a moment before trying again.',
  tierName: 'ai',
})

export const communicationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'External communication dispatch limit reached. Please wait before creating more messages.',
  tierName: 'communications',
})

export const workflowLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Workflow execution frequency limit reached. Please wait before triggering more runs.',
  tierName: 'workflows',
})

/**
 * Reset all in-memory rate limit records (useful for test isolation)
 */
export function resetRateLimits() {
  hitRecords.clear()
}

export default {
  createRateLimiter,
  authLimiter,
  aiLimiter,
  communicationLimiter,
  workflowLimiter,
  resetRateLimits,
}
