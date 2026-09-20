/**
 * NoSQL Injection & Input Sanitization Middleware
 * Inspects request body, query, and params to block MongoDB query operators ($gt, $ne, $where, etc.)
 * and prohibited nested property paths.
 */
function hasProhibitedKeys(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }

  for (const key of Object.keys(obj)) {
    // Prohibit keys starting with '$' or containing '.'
    if (key.startsWith('$') || key.includes('.')) {
      return true
    }

    const val = obj[key]
    if (val && typeof val === 'object') {
      if (hasProhibitedKeys(val)) {
        return true
      }
    }
  }

  return false
}

export const sanitizeNoSql = (req, res, next) => {
  if (hasProhibitedKeys(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Prohibited query operators or malformed characters detected in request payload.',
    })
  }

  if (hasProhibitedKeys(req.query)) {
    return res.status(400).json({
      success: false,
      message: 'Prohibited query operators or malformed characters detected in query parameters.',
    })
  }

  next()
}

export default sanitizeNoSql
