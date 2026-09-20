import { Router } from 'express'
import { getAnalytics, getInsightsEndpoint } from '../controllers/analyticsController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)

router.get('/', getAnalytics)
router.get('/insights', getInsightsEndpoint)

export default router

