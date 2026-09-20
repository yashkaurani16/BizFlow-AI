import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

dotenv.config()
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js'
import {
  aiLimiter,
  authLimiter,
  communicationLimiter,
  workflowLimiter,
} from './middleware/rateLimiter.js'
import sanitizeNoSql from './middleware/sanitizeInput.js'
import securityHeaders from './middleware/securityHeaders.js'
import agentsRoutes from './routes/agentsRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import authRoutes from './routes/authRoutes.js'
import communicationRoutes from './routes/communicationRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import leadsRoutes from './routes/leadsRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import workflowsRoutes from './routes/workflowsRoutes.js'

const app = express()

// 1. Disable framework disclosure header
app.disable('x-powered-by')

// 2. Enforce standard security headers
app.use(securityHeaders)

// 3. CORS configuration
const clientOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)

const allowedOrigins = [
  ...clientOrigins,
  'http://localhost:5176',
  'http://localhost:5173',
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(null, false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Test-Bypass-Rate-Limit',
      'X-Test-Rate-Limit-Check',
    ],
  }),
)

// 4. Request size limits to prevent payload memory exhaustion
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// 5. Input sanitization against NoSQL query operator injection
app.use(sanitizeNoSql)

// 6. Public health & system diagnostic routes
app.use('/api', healthRoutes)

// 7. Sensitive routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/ai', aiLimiter, aiRoutes)
app.use('/api/communications', communicationLimiter, communicationRoutes)
app.use('/api/workflows', workflowLimiter, workflowsRoutes)

// 8. Core authenticated business routes
app.use('/api/leads', leadsRoutes)
app.use('/api/agents', agentsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/profile', profileRoutes)

// 9. 404 Not Found handling
app.use(notFoundHandler)

// 10. Central Production-Hardened Error Handling
app.use(errorHandler)

export default app
