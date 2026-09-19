import mongoose from 'mongoose'
import { Agent } from '../models/index.js'
import { defaultMvpAgents, getDevUserAgents } from '../utils/devStore.js'

/**
 * GET /api/agents
 * Fetch all agents owned by user (seed defaults if first time)
 */
export const getAgents = async (req, res, next) => {
  try {
    const userId = req.user._id
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      let agents = await Agent.find({ owner: userId }).sort({ createdAt: 1 })

      if (agents.length === 0) {
        // Seed default MVP agents for this user
        const toSeed = defaultMvpAgents.map((a) => ({ ...a, owner: userId }))
        agents = await Agent.insertMany(toSeed)
      }

      return res.status(200).json({ success: true, agents })
    }

    // Offline dev fallback
    const agents = getDevUserAgents(userId)
    return res.status(200).json({ success: true, agents })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/agents/:id
 * Fetch single agent by ID
 */
export const getAgentById = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { id } = req.params
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const agent = await Agent.findOne({ _id: id, owner: userId })
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Agent not found' })
      }
      return res.status(200).json({ success: true, agent })
    }

    const agents = getDevUserAgents(userId)
    const agent = agents.find((a) => a._id.toString() === id.toString())
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' })
    }

    return res.status(200).json({ success: true, agent })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/agents
 * Create a new agent
 */
export const createAgent = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { name, type, description = '', instructions = '', status = 'Active' } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Agent name is required' })
    }
    if (!type) {
      return res.status(400).json({ success: false, message: 'Agent type is required' })
    }

    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const agent = await Agent.create({
        name: name.trim(),
        type,
        description: (description || '').trim(),
        instructions: (instructions || '').trim(),
        status,
        owner: userId,
      })

      return res.status(201).json({ success: true, message: 'Agent created', agent })
    }

    // Offline dev fallback
    const agents = getDevUserAgents(userId)
    const newAgent = {
      _id: new mongoose.Types.ObjectId(),
      name: name.trim(),
      type,
      description: (description || '').trim(),
      instructions: (instructions || '').trim(),
      status,
      owner: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    agents.push(newAgent)

    return res.status(201).json({ success: true, message: 'Agent created', agent: newAgent })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message })
    }
    next(error)
  }
}

/**
 * PUT /api/agents/:id
 * Update an existing agent
 */
export const updateAgent = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { id } = req.params
    const { name, type, description, instructions, status } = req.body
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const agent = await Agent.findOne({ _id: id, owner: userId })
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Agent not found' })
      }

      if (name !== undefined) agent.name = name.trim()
      if (type !== undefined) agent.type = type
      if (description !== undefined) agent.description = (description || '').trim()
      if (instructions !== undefined) agent.instructions = (instructions || '').trim()
      if (status !== undefined) agent.status = status

      await agent.save()
      return res.status(200).json({ success: true, message: 'Agent updated', agent })
    }

    // Offline dev fallback
    const agents = getDevUserAgents(userId)
    const index = agents.findIndex((a) => a._id.toString() === id.toString())
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Agent not found' })
    }

    const current = agents[index]
    const updated = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      type: type !== undefined ? type : current.type,
      description: description !== undefined ? (description || '').trim() : current.description,
      instructions: instructions !== undefined ? (instructions || '').trim() : current.instructions,
      status: status !== undefined ? status : current.status,
      updatedAt: new Date(),
    }
    agents[index] = updated

    return res.status(200).json({ success: true, message: 'Agent updated', agent: updated })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/agents/:id
 * Delete an agent
 */
export const deleteAgent = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { id } = req.params
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const agent = await Agent.findOneAndDelete({ _id: id, owner: userId })
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Agent not found' })
      }
      return res.status(200).json({ success: true, message: 'Agent deleted' })
    }

    const agents = getDevUserAgents(userId)
    const index = agents.findIndex((a) => a._id.toString() === id.toString())
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Agent not found' })
    }
    agents.splice(index, 1)

    return res.status(200).json({ success: true, message: 'Agent deleted' })
  } catch (error) {
    next(error)
  }
}

export default {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
}
