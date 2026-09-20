import { Router } from 'express'
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflowById,
  getWorkflows,
  updateWorkflow,
  validateWorkflowEndpoint,
} from '../controllers/workflowsController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)

router.get('/', getWorkflows)
router.post('/', createWorkflow)
router.post('/validate', validateWorkflowEndpoint)
router.get('/:id', getWorkflowById)
router.put('/:id', updateWorkflow)
router.delete('/:id', deleteWorkflow)

export default router

