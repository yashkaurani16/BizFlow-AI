import mongoose from 'mongoose'
import { Activity, FollowUpTask, Lead } from '../models/index.js'
import { executeNewLeadWorkflow } from '../services/workflowEngine.js'
import { getDevUserActivities, getDevUserLeads } from '../utils/devStore.js'

/**
 * GET /api/leads
 * Fetch all leads owned by the authenticated user
 */
export const getLeads = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { status, search } = req.query
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const query = { owner: userId }

      if (status && status !== 'All') {
        query.status = status
      }

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i')
        query.$or = [{ name: regex }, { email: regex }, { company: regex }]
      }

      const leads = await Lead.find(query).sort({ createdAt: -1 })
      return res.status(200).json({ success: true, leads })
    }

    // Offline dev fallback
    let userLeads = [...getDevUserLeads(userId)]
    if (status && status !== 'All') {
      userLeads = userLeads.filter((l) => l.status === status)
    }
    if (search && search.trim()) {
      const s = search.trim().toLowerCase()
      userLeads = userLeads.filter(
        (l) =>
          l.name.toLowerCase().includes(s) ||
          l.email.toLowerCase().includes(s) ||
          (l.company && l.company.toLowerCase().includes(s)),
      )
    }

    return res.status(200).json({ success: true, leads: userLeads })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/leads/:id
 * Fetch single lead by ID with ownership verification
 */
export const getLeadById = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { id } = req.params
    const isDbConnected = mongoose.connection.readyState === 1

    if (!mongoose.Types.ObjectId.isValid(id) && isDbConnected) {
      return res.status(400).json({ success: false, message: 'Invalid lead ID format' })
    }

    if (isDbConnected) {
      const lead = await Lead.findOne({ _id: id, owner: userId })
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' })
      }

      const tasks = await FollowUpTask.find({ lead: lead._id, owner: userId }).sort({
        createdAt: -1,
      })
      const activities = await Activity.find({ lead: lead._id, owner: userId }).sort({
        createdAt: -1,
      })

      return res.status(200).json({
        success: true,
        lead: {
          ...lead.toObject(),
          tasks,
          activities,
        },
      })
    }

    // Offline dev fallback
    const userLeads = getDevUserLeads(userId)
    const lead = userLeads.find((l) => l._id.toString() === id.toString())
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' })
    }

    return res.status(200).json({ success: true, lead })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/leads
 * Create a new lead and trigger the fixed follow-up workflow
 */
export const createLead = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { name, email, phone = '', company = '', status = 'New', source = 'Website', notes = '' } =
      req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Lead name is required' })
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Lead email is required' })
    }

    const isDbConnected = mongoose.connection.readyState === 1
    let lead = null

    if (isDbConnected) {
      lead = await Lead.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: (phone || '').trim(),
        company: (company || '').trim(),
        status,
        source: (source || 'Website').trim(),
        notes: (notes || '').trim(),
        owner: userId,
      })

      // Record lead creation activity
      await Activity.create({
        type: 'lead_created',
        title: `New lead captured: ${lead.name}`,
        description: `Source: ${lead.source} | Company: ${lead.company || 'Direct'}`,
        lead: lead._id,
        status: 'New',
        owner: userId,
      })
    } else {
      // Offline dev fallback
      const now = new Date()
      lead = {
        _id: new mongoose.Types.ObjectId(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: (phone || '').trim(),
        company: (company || '').trim(),
        status,
        source: (source || 'Website').trim(),
        notes: (notes || '').trim(),
        aiAnalysis: '',
        suggestedNextStep: '',
        owner: userId,
        createdAt: now,
        updatedAt: now,
      }
      getDevUserLeads(userId).unshift(lead)

      const creationAct = {
        _id: new mongoose.Types.ObjectId(),
        type: 'lead_created',
        title: `New lead captured: ${lead.name}`,
        description: `Source: ${lead.source} | Company: ${lead.company || 'Direct'}`,
        lead: lead._id,
        status: 'New',
        owner: userId,
        createdAt: now,
      }
      getDevUserActivities(userId).unshift(creationAct)
    }

    // Trigger the fixed MVP New Lead workflow (runs asynchronously / inline)
    await executeNewLeadWorkflow(lead, userId)

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead,
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message })
    }
    next(error)
  }
}

/**
 * PUT /api/leads/:id
 * Update an existing lead with ownership verification
 */
export const updateLead = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { id } = req.params
    const { name, email, phone, company, status, source, notes } = req.body
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const lead = await Lead.findOne({ _id: id, owner: userId })
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' })
      }

      const previousStatus = lead.status

      if (name !== undefined) lead.name = name.trim()
      if (email !== undefined) lead.email = email.trim().toLowerCase()
      if (phone !== undefined) lead.phone = (phone || '').trim()
      if (company !== undefined) lead.company = (company || '').trim()
      if (status !== undefined) lead.status = status
      if (source !== undefined) lead.source = (source || '').trim()
      if (notes !== undefined) lead.notes = (notes || '').trim()

      await lead.save()

      // Record status change activity if changed
      if (status && status !== previousStatus) {
        await Activity.create({
          type: 'status_changed',
          title: `Lead status updated to ${status}`,
          description: `Changed from ${previousStatus} to ${status}`,
          lead: lead._id,
          status,
          owner: userId,
        })
      }

      return res.status(200).json({ success: true, message: 'Lead updated', lead })
    }

    // Offline dev fallback
    const userLeads = getDevUserLeads(userId)
    const index = userLeads.findIndex((l) => l._id.toString() === id.toString())
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Lead not found' })
    }

    const current = userLeads[index]
    const updated = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      email: email !== undefined ? email.trim().toLowerCase() : current.email,
      phone: phone !== undefined ? (phone || '').trim() : current.phone,
      company: company !== undefined ? (company || '').trim() : current.company,
      status: status !== undefined ? status : current.status,
      notes: notes !== undefined ? (notes || '').trim() : current.notes,
      updatedAt: new Date(),
    }
    userLeads[index] = updated

    return res.status(200).json({ success: true, message: 'Lead updated', lead: updated })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/leads/:id
 * Delete lead with ownership verification
 */
export const deleteLead = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { id } = req.params
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const lead = await Lead.findOneAndDelete({ _id: id, owner: userId })
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' })
      }

      // Cleanup related records
      await FollowUpTask.deleteMany({ lead: id, owner: userId })
      await Activity.deleteMany({ lead: id, owner: userId })

      return res.status(200).json({ success: true, message: 'Lead deleted successfully' })
    }

    // Offline dev fallback
    const userLeads = getDevUserLeads(userId)
    const index = userLeads.findIndex((l) => l._id.toString() === id.toString())
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Lead not found' })
    }
    userLeads.splice(index, 1)

    return res.status(200).json({ success: true, message: 'Lead deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export default {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
}
