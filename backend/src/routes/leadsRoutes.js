import { Router } from 'express'
import {
  analyzeLeadAction,
  createLead,
  deleteLead,
  getLeadById,
  getLeads,
  updateLead,
} from '../controllers/leadsController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)

router.get('/', getLeads)
router.post('/', createLead)
router.get('/:id', getLeadById)
router.put('/:id', updateLead)
router.delete('/:id', deleteLead)
router.post('/:id/analyze', analyzeLeadAction)

export default router
