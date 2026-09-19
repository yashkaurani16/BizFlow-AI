import { Router } from 'express'
import mongoose from 'mongoose'

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

export default router
