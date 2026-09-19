import mongoose from 'mongoose'
import { Activity, Agent, FollowUpTask, Lead, Workflow } from '../models/index.js'
import {
  getDevUserActivities,
  getDevUserAgents,
  getDevUserLeads,
  getDevUserTasks,
  getDevUserWorkflows,
} from '../utils/devStore.js'

/**
 * GET /api/dashboard
 * Calculate dashboard aggregates dynamically from operational data
 */
export const getDashboardMetrics = async (req, res, next) => {
  try {
    const userId = req.user._id
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const [totalLeads, activeAgents, activeWorkflows, pendingTasks, leads, recentActivities] =
        await Promise.all([
          Lead.countDocuments({ owner: userId }),
          Agent.countDocuments({ owner: userId, status: 'Active' }),
          Workflow.countDocuments({ owner: userId, status: 'Active' }),
          FollowUpTask.countDocuments({ owner: userId, status: 'Pending' }),
          Lead.find({ owner: userId }).select('status'),
          Activity.find({ owner: userId }).sort({ createdAt: -1 }).limit(10),
        ])

      const pipeline = {
        New: 0,
        Contacted: 0,
        Qualified: 0,
        Converted: 0,
        Lost: 0,
      }

      leads.forEach((l) => {
        if (pipeline[l.status] !== undefined) {
          pipeline[l.status] += 1
        }
      })

      const conversionRate = totalLeads > 0 ? ((pipeline.Converted / totalLeads) * 100).toFixed(1) : '0.0'

      return res.status(200).json({
        success: true,
        metrics: {
          totalLeads,
          activeAgents,
          activeWorkflows,
          followUpTasks: pendingTasks,
          conversionRate: `${conversionRate}%`,
          pipeline,
          recentActivities,
        },
      })
    }

    // Offline dev fallback metrics computed dynamically
    const devLeads = getDevUserLeads(userId)
    const devAgents = getDevUserAgents(userId)
    const devWorkflows = getDevUserWorkflows(userId)
    const devTasks = getDevUserTasks(userId)
    const devActivities = getDevUserActivities(userId)

    const totalLeads = devLeads.length
    const activeAgents = devAgents.filter((a) => a.status === 'Active').length
    const activeWorkflows = devWorkflows.filter((w) => w.status === 'Active').length
    const followUpTasks = devTasks.filter((t) => t.status === 'Pending').length

    const pipeline = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Converted: 0,
      Lost: 0,
    }

    devLeads.forEach((l) => {
      if (pipeline[l.status] !== undefined) {
        pipeline[l.status] += 1
      }
    })

    const conversionRate =
      totalLeads > 0 ? `${((pipeline.Converted / totalLeads) * 100).toFixed(1)}%` : '0.0%'

    return res.status(200).json({
      success: true,
      metrics: {
        totalLeads,
        activeAgents,
        activeWorkflows,
        followUpTasks,
        conversionRate,
        pipeline,
        recentActivities: devActivities.slice(0, 10),
      },
    })
  } catch (error) {
    next(error)
  }
}

export default {
  getDashboardMetrics,
}
