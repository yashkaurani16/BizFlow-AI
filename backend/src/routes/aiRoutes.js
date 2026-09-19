import { Router } from 'express'
import { getAIProviderStatus } from '../services/ai/aiService.js'

const router = Router()

/**
 * GET /api/ai/status
 * Public/authenticated status of backend AI provider integration
 */
router.get('/status', (req, res) => {
  const status = getAIProviderStatus()
  return res.status(200).json({ success: true, ...status })
})

export default router
