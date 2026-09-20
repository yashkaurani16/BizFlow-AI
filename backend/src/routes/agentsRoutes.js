import { Router } from 'express'
import {
  createAgent,
  deleteAgent,
  getAgentById,
  getAgents,
  updateAgent,
} from '../controllers/agentsController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validateObjectId } from '../middleware/validateObjectId.js'

const router = Router()

router.use(protect)

router.get('/', getAgents)
router.post('/', createAgent)
router.get('/:id', validateObjectId('id'), getAgentById)
router.put('/:id', validateObjectId('id'), updateAgent)
router.delete('/:id', validateObjectId('id'), deleteAgent)

export default router
