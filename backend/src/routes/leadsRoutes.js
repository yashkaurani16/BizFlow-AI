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
import { validateObjectId } from '../middleware/validateObjectId.js'

const router = Router()

router.use(protect)

router.get('/', getLeads)
router.post('/', createLead)
router.get('/:id', validateObjectId('id'), getLeadById)
router.put('/:id', validateObjectId('id'), updateLead)
router.delete('/:id', validateObjectId('id'), deleteLead)
router.post('/:id/analyze', validateObjectId('id'), analyzeLeadAction)

export default router
