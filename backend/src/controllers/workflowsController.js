import mongoose from 'mongoose'
import { Workflow, WorkflowExecution } from '../models/index.js'
import {
  defaultMvpWorkflow,
  getDevUserExecutions,
  getDevUserWorkflows,
} from '../utils/devStore.js'

/**
 * GET /api/workflows
 * Fetch all workflows owned by user
 */
export const getWorkflows = async (req, res, next) => {
  try {
    const userId = req.user._id
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      let workflows = await Workflow.find({ owner: userId }).populate('assignedAgent')

      if (workflows.length === 0) {
        const seeded = await Workflow.create({
          ...defaultMvpWorkflow,
          owner: userId,
        })
        workflows = [seeded]
      }

      return res.status(200).json({ success: true, workflows })
    }

    const workflows = getDevUserWorkflows(userId)
    return res.status(200).json({ success: true, workflows })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/workflows/:id
 * Fetch single workflow by ID with executions
 */
export const getWorkflowById = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { id } = req.params
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const workflow = await Workflow.findOne({ _id: id, owner: userId }).populate('assignedAgent')
      if (!workflow) {
        return res.status(404).json({ success: false, message: 'Workflow not found' })
      }

      const executions = await WorkflowExecution.find({ workflow: workflow._id })
        .populate('lead', 'name email company status')
        .populate('agent', 'name type')
        .sort({ createdAt: -1 })
        .limit(20)

      return res.status(200).json({
        success: true,
        workflow: {
          ...workflow.toObject(),
          executions,
        },
      })
    }

    const workflows = getDevUserWorkflows(userId)
    const workflow = workflows.find((w) => w._id.toString() === id.toString())
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' })
    }

    const executions = getDevUserExecutions(userId)

    return res.status(200).json({
      success: true,
      workflow: { ...workflow, executions },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/workflows
 * Create a new workflow
 */
export const createWorkflow = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { name, description = '', trigger = 'New Lead Created', assignedAgent, status = 'Active' } =
      req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Workflow name is required' })
    }

    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const workflow = await Workflow.create({
        name: name.trim(),
        description: (description || '').trim(),
        trigger: (trigger || 'New Lead Created').trim(),
        assignedAgent: assignedAgent || undefined,
        status,
        owner: userId,
      })

      return res.status(201).json({ success: true, message: 'Workflow created', workflow })
    }

    // Offline dev fallback
    const workflows = getDevUserWorkflows(userId)
    const newWorkflow = {
      _id: new mongoose.Types.ObjectId(),
      name: name.trim(),
      description: (description || '').trim(),
      trigger: (trigger || 'New Lead Created').trim(),
      assignedAgent,
      status,
      owner: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    workflows.push(newWorkflow)

    return res.status(201).json({ success: true, message: 'Workflow created', workflow: newWorkflow })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message })
    }
    next(error)
  }
}

/**
 * PUT /api/workflows/:id
 * Update workflow
 */
export const updateWorkflow = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { id } = req.params
    const { name, description, trigger, assignedAgent, status } = req.body
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const workflow = await Workflow.findOne({ _id: id, owner: userId })
      if (!workflow) {
        return res.status(404).json({ success: false, message: 'Workflow not found' })
      }

      if (name !== undefined) workflow.name = name.trim()
      if (description !== undefined) workflow.description = (description || '').trim()
      if (trigger !== undefined) workflow.trigger = (trigger || '').trim()
      if (assignedAgent !== undefined) workflow.assignedAgent = assignedAgent || undefined
      if (status !== undefined) workflow.status = status

      await workflow.save()
      return res.status(200).json({ success: true, message: 'Workflow updated', workflow })
    }

    const workflows = getDevUserWorkflows(userId)
    const index = workflows.findIndex((w) => w._id.toString() === id.toString())
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Workflow not found' })
    }

    const current = workflows[index]
    const updated = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      description: description !== undefined ? (description || '').trim() : current.description,
      trigger: trigger !== undefined ? (trigger || '').trim() : current.trigger,
      assignedAgent: assignedAgent !== undefined ? assignedAgent : current.assignedAgent,
      status: status !== undefined ? status : current.status,
      updatedAt: new Date(),
    }
    workflows[index] = updated

    return res.status(200).json({ success: true, message: 'Workflow updated', workflow: updated })
  } catch (error) {
    next(error)
  }
}

export default {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
}
