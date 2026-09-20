/**
 * Dedicated Communication Controller for BizFlow AI
 * Handles provider status, AI draft generation, and human-approved communication dispatch.
 * CRITICAL SAFETY ENFORCEMENT:
 * - Direct AI automated sending is prohibited.
 * - Human approval is strictly verified prior to sending.
 * - All actions are audited via Activity records.
 */

import mongoose from 'mongoose'
import { Activity, Lead } from '../models/index.js'
import communicationService from '../services/communications/index.js'
import { getDevUserActivities, getDevUserLeads } from '../utils/devStore.js'

/**
 * GET /api/communications/status
 * Returns sanitized status for all external communication adapters.
 */
export async function getProviderStatuses(req, res, next) {
  try {
    const statuses = communicationService.getAllProviderStatuses()
    return res.status(200).json({
      success: true,
      data: statuses,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/communications/draft
 * Generates an AI-powered communication draft for human review.
 * Does NOT send external communications.
 */
export async function generateCommunicationDraft(req, res, next) {
  try {
    const { leadId, channel = 'email', customNotes, tone } = req.body
    const userId = req.user._id

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID is required to generate a communication draft.',
      })
    }

    const normalizedChannel = (channel || 'email').toLowerCase().trim()
    if (!['email', 'whatsapp', 'sms'].includes(normalizedChannel)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported channel: "${channel}". Supported channels are email, whatsapp, and sms.`,
      })
    }

    // Find lead in DB or devStore
    const isDbConnected = mongoose.connection.readyState === 1
    let lead = null

    if (isDbConnected) {
      lead = await Lead.findOne({ _id: leadId, owner: userId })
    } else {
      const userLeads = getDevUserLeads(userId)
      lead = userLeads.find((l) => l._id.toString() === leadId.toString() || l.id === leadId)
    }

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or unauthorized.',
      })
    }

    const draft = await communicationService.generateDraft(lead, normalizedChannel, {
      customNotes,
      tone,
    })

    // Record Activity audit log for Draft Generation (Pending Human Review)
    const channelLabel = normalizedChannel.charAt(0).toUpperCase() + normalizedChannel.slice(1)
    const draftPreview = (draft.body || '').slice(0, 80)
    const draftTitle = `AI ${channelLabel} draft generated for ${draft.recipient || lead.name}`
    const draftDesc = `Draft generated for human review: "${draft.subject ? `${draft.subject} — ` : ''}${draftPreview}..." (Requires Human Review)`

    let draftActivity = null
    if (isDbConnected) {
      draftActivity = await Activity.create({
        type: 'communication_draft_generated',
        title: draftTitle,
        description: draftDesc,
        lead: lead._id,
        owner: userId,
        status: 'Pending',
        channel: normalizedChannel,
        recipient: draft.recipient || '',
        isAiGenerated: true,
        humanApproved: false,
        metadata: {
          channel: normalizedChannel,
          recipient: draft.recipient,
          isAiGenerated: true,
          humanApproved: false,
          notice: draft.notice,
        },
      })
    } else {
      const devActivities = getDevUserActivities(userId)
      draftActivity = {
        _id: new mongoose.Types.ObjectId(),
        type: 'communication_draft_generated',
        title: draftTitle,
        description: draftDesc,
        lead: lead._id,
        owner: userId,
        status: 'Pending',
        channel: normalizedChannel,
        recipient: draft.recipient || '',
        isAiGenerated: true,
        humanApproved: false,
        metadata: {
          channel: normalizedChannel,
          recipient: draft.recipient,
          isAiGenerated: true,
          humanApproved: false,
          notice: draft.notice,
        },
        createdAt: new Date(),
      }
      devActivities.unshift(draftActivity)
    }

    return res.status(200).json({
      success: true,
      draft,
      activity: draftActivity,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/communications/send
 * Dispatches an external communication with mandatory human review & approval verification.
 */
export async function sendExternalCommunication(req, res, next) {
  const userId = req.user._id
  const {
    leadId,
    channel,
    recipient,
    subject,
    content,
    humanApproved,
    isAiGenerated = false,
  } = req.body

  // 1. Mandatory Human Approval Check
  if (humanApproved !== true) {
    return res.status(400).json({
      success: false,
      message: 'External communication requires explicit human review and approval before sending.',
      code: 'HUMAN_APPROVAL_REQUIRED',
    })
  }

  // 2. Channel & Payload Validation
  const normalizedChannel = (channel || '').toLowerCase().trim()
  if (!['email', 'whatsapp', 'sms'].includes(normalizedChannel)) {
    return res.status(400).json({
      success: false,
      message: `Invalid communication channel: "${channel}". Supported channels are email, whatsapp, and sms.`,
    })
  }

  if (!recipient || typeof recipient !== 'string' || !recipient.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Recipient address or phone number is required.',
    })
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Message content cannot be empty.',
    })
  }

  if (normalizedChannel === 'email' && (!subject || !subject.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Subject line is required for email communication.',
    })
  }

  // 3. Find Lead
  const isDbConnected = mongoose.connection.readyState === 1
  let lead = null

  if (leadId) {
    if (isDbConnected) {
      lead = await Lead.findOne({ _id: leadId, owner: userId })
    } else {
      const userLeads = getDevUserLeads(userId)
      lead = userLeads.find((l) => l._id.toString() === leadId.toString() || l.id === leadId)
    }
  }

  if (leadId && !lead) {
    return res.status(404).json({
      success: false,
      message: 'Associated lead not found or unauthorized.',
    })
  }

  const sanitizedRecipient = recipient.trim()
  const sanitizedContent = content.trim()
  const sanitizedSubject = subject ? subject.trim() : undefined

  try {
    // 4. Dispatch via Communication Service Layer
    const sendResult = await communicationService.sendCommunication({
      channel: normalizedChannel,
      recipient: sanitizedRecipient,
      subject: sanitizedSubject,
      content: sanitizedContent,
      humanApproved: true,
      isAiGenerated: Boolean(isAiGenerated),
      metadata: {
        leadId: lead ? lead._id : undefined,
      },
    })

    // 5. Create Activity Record (Success)
    const isSimulated = sendResult.mode === 'sandbox' || Boolean(sendResult.simulated)
    const modeBadge = isSimulated ? '[Sandbox Simulated] ' : ''
    const channelLabel = normalizedChannel.charAt(0).toUpperCase() + normalizedChannel.slice(1)
    const previewContent = sanitizedContent.length > 80 ? `${sanitizedContent.slice(0, 80)}...` : sanitizedContent
    const activityTitle = `${modeBadge}${channelLabel} sent to ${sanitizedRecipient}`
    const activityDesc = `${previewContent} (Human Approved${isAiGenerated ? ' | AI Draft' : ''}${isSimulated ? ' | Simulated Sandbox' : ''})`

    let activity = null

    if (isDbConnected) {
      activity = await Activity.create({
        type: 'communication_sent',
        title: activityTitle,
        description: activityDesc,
        lead: lead ? lead._id : undefined,
        owner: userId,
        status: 'Succeeded',
        channel: normalizedChannel,
        recipient: sanitizedRecipient,
        isAiGenerated: Boolean(isAiGenerated),
        humanApproved: true,
        metadata: {
          messageId: sendResult.messageId,
          channel: normalizedChannel,
          recipient: sanitizedRecipient,
          deliveredAt: sendResult.deliveredAt,
          mode: sendResult.mode,
          simulated: isSimulated,
        },
      })
    } else {
      const devActivities = getDevUserActivities(userId)
      activity = {
        _id: new mongoose.Types.ObjectId(),
        type: 'communication_sent',
        title: activityTitle,
        description: activityDesc,
        lead: lead ? lead._id : undefined,
        owner: userId,
        status: 'Succeeded',
        channel: normalizedChannel,
        recipient: sanitizedRecipient,
        isAiGenerated: Boolean(isAiGenerated),
        humanApproved: true,
        metadata: {
          messageId: sendResult.messageId,
          channel: normalizedChannel,
          recipient: sanitizedRecipient,
          deliveredAt: sendResult.deliveredAt,
          mode: sendResult.mode,
          simulated: isSimulated,
        },
        createdAt: new Date(),
      }
      devActivities.unshift(activity)
    }

    return res.status(200).json({
      success: true,
      message: `${channelLabel} communication dispatched successfully.`,
      result: sendResult,
      activity,
    })
  } catch (error) {
    // 6. Failure handling and Activity Logging
    const channelLabel = normalizedChannel.charAt(0).toUpperCase() + normalizedChannel.slice(1)
    const failTitle = `${channelLabel} communication failed to ${sanitizedRecipient}`
    const failDesc = `Failed: ${error.message || 'Dispatch error'}`

    if (isDbConnected) {
      await Activity.create({
        type: 'communication_failed',
        title: failTitle,
        description: failDesc,
        lead: lead ? lead._id : undefined,
        owner: userId,
        status: 'Failed',
        channel: normalizedChannel,
        recipient: sanitizedRecipient,
        isAiGenerated: Boolean(isAiGenerated),
        humanApproved: true,
        metadata: {
          errorCode: error.code || 'UNKNOWN',
          channel: normalizedChannel,
          recipient: sanitizedRecipient,
        },
      }).catch(() => null)
    } else {
      const devActivities = getDevUserActivities(userId)
      devActivities.unshift({
        _id: new mongoose.Types.ObjectId(),
        type: 'communication_failed',
        title: failTitle,
        description: failDesc,
        lead: lead ? lead._id : undefined,
        owner: userId,
        status: 'Failed',
        channel: normalizedChannel,
        recipient: sanitizedRecipient,
        isAiGenerated: Boolean(isAiGenerated),
        humanApproved: true,
        createdAt: new Date(),
      })
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Communication dispatch failed',
      code: error.code || 'SEND_ERROR',
    })
  }
}

export default {
  getProviderStatuses,
  generateCommunicationDraft,
  sendExternalCommunication,
}
