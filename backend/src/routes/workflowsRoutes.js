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
import { validateObjectId } from '../middleware/validateObjectId.js'

const router = Router()

router.use(protect)

router.get('/', getWorkflows)
router.post('/', createWorkflow)
router.post('/validate', validateWorkflowEndpoint)
router.get('/:id', validateObjectId('id'), getWorkflowById)
router.put('/:id', validateObjectId('id'), updateWorkflow)
router.delete('/:id', validateObjectId('id'), deleteWorkflow)

export default router
