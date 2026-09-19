import { Router } from 'express'
import {
  createAgent,
  deleteAgent,
  getAgentById,
  getAgents,
  updateAgent,
} from '../controllers/agentsController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)

router.get('/', getAgents)
router.post('/', createAgent)
router.get('/:id', getAgentById)
router.put('/:id', updateAgent)
router.delete('/:id', deleteAgent)

export default router
