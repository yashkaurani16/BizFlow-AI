import { Router } from 'express'
import { getDashboardMetrics } from '../controllers/dashboardController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)

router.get('/', getDashboardMetrics)

export default router
