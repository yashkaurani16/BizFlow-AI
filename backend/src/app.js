import cors from 'cors'
import express from 'express'
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js'
import agentsRoutes from './routes/agentsRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import authRoutes from './routes/authRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import leadsRoutes from './routes/leadsRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import workflowsRoutes from './routes/workflowsRoutes.js'

const app = express()

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5176',
  'http://localhost:5173',
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`))
      }
    },
    credentials: true,
  }),
)

// Body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API Routes
app.use('/api', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/agents', agentsRoutes)
app.use('/api/workflows', workflowsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/profile', profileRoutes)

// 404 Not Found handling
app.use(notFoundHandler)

// Central Error Handling
app.use(errorHandler)

export default app
