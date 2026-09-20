/**
 * Security Headers Middleware for BizFlow AI
 * Enforces defense-in-depth HTTP response headers against clickjacking,
 * MIME-sniffing, XSS, and unencrypted transport without third-party dependencies.
 */
export const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // Prevent clickjacking / framing
  res.setHeader('X-Frame-Options', 'DENY')

  // Disable legacy buggy XSS auditor in modern browsers
  res.setHeader('X-XSS-Protection', '0')

  // Enforce HTTPS in production / modern environments
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  // Restrict referrer information leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; frame-ancestors 'none'; object-src 'none';",
  )

  // Cross-Origin Isolation policies
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site')

  next()
}

export default securityHeaders
