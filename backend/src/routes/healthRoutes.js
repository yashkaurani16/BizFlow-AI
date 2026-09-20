import { Router } from 'express'
import mongoose from 'mongoose'
import { resetRateLimits } from '../middleware/rateLimiter.js'

const router = Router()

router.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1

  res.status(200).json({
    success: true,
    message: 'BizFlow AI API is running',
    database: {
      status: isDbConnected ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
    },
  })
})

// Endpoint to reset rate limits for test isolation in non-production environments
router.post('/health/reset-rate-limits', (req, res) => {
  resetRateLimits()
  res.status(200).json({
    success: true,
    message: 'Rate limits successfully reset.',
  })
})

export default router
