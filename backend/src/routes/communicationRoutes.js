import { Router } from 'express'
import {
  generateCommunicationDraft,
  getProviderStatuses,
  sendExternalCommunication,
} from '../controllers/communicationController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

// All external communication endpoints require authentication
router.use(protect)

/**
 * GET /api/communications/status
 * Check configuration and operational status of communication providers
 */
router.get('/status', getProviderStatuses)

/**
 * POST /api/communications/draft
 * Generate an AI-powered communication draft based on CRM lead information
 */
router.post('/draft', generateCommunicationDraft)

/**
 * POST /api/communications/send
 * Dispatch an external communication (requires explicit human approval)
 */
router.post('/send', sendExternalCommunication)

export default router
