import { Router } from 'express'
import {
  createWorkflow,
  getWorkflowById,
  getWorkflows,
  updateWorkflow,
} from '../controllers/workflowsController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)

router.get('/', getWorkflows)
router.post('/', createWorkflow)
router.get('/:id', getWorkflowById)
router.put('/:id', updateWorkflow)

export default router
