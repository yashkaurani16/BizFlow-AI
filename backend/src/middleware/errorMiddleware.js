/**
 * Production-Hardened Central Error Middleware
 * Safely handles application exceptions, JSON parse errors, payload limits,
 * and Mongoose validation errors without leaking stack traces or internal database paths.
 */

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  })
}

export const errorHandler = (err, req, res, next) => {
  // 1. Malformed JSON Body (Express Body Parser SyntaxError)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body.',
    })
  }

  // 2. Request Entity Too Large (Payload size limit exceeded)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: 'Request payload exceeds allowed size limit (1MB max).',
    })
  }

  // 3. Mongoose CastError (Malformed ObjectId or data type casting)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid identifier format provided.',
    })
  }

  // 4. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errorDetails = Object.values(err.errors || {}).map((e) => e.message)
    return res.status(400).json({
      success: false,
      message: errorDetails[0] || 'Database validation failed.',
      errors: errorDetails,
    })
  }

  // 5. JWT Authentication Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token.',
    })
  }

  // 6. Generic Server Error (Never leak stack traces or internal database URIs)
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.status || 500)
  const safeMessage =
    statusCode >= 500
      ? 'An internal server error occurred. Please try again later.'
      : err.message || 'Operation failed.'

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
  })
}

export default {
  notFoundHandler,
  errorHandler,
}
