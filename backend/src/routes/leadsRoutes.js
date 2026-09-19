import { Router } from 'express'
import {
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

export default router
