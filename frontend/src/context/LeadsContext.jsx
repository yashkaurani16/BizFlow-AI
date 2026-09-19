import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createLeadRecord, initialLeads } from '../data/leadsData.js'
import { leadsApi } from '../services/api.js'
import { formatDate } from '../utils/dates.js'

const LeadsContext = createContext(null)

function normalizeLead(lead) {
  if (!lead) return null
  const id = lead.id || lead._id?.toString() || ''
  const createdDate = lead.createdAt ? new Date(lead.createdAt) : new Date()
  const createdLabel = lead.createdLabel || formatDate(createdDate)

  let aiAnalysisObj = lead.aiAnalysis
  if (typeof aiAnalysisObj === 'string') {
    aiAnalysisObj = {
      isMock: true,
      status: aiAnalysisObj ? 'available' : 'pending',
      summary: aiAnalysisObj,
    }
  } else if (!aiAnalysisObj || typeof aiAnalysisObj !== 'object') {
    aiAnalysisObj = {
      isMock: true,
      status: 'pending',
      summary: '',
    }
  }

  let followUpTaskObj = lead.followUpTask
  if (!followUpTaskObj && Array.isArray(lead.tasks) && lead.tasks.length > 0) {
    const t = lead.tasks[0]
    followUpTaskObj = {
      status: t.status || 'Pending',
      task: t.title || t.description || 'Review lead and follow up',
      created: t.createdAt ? formatDate(new Date(t.createdAt)) : createdLabel,
    }
  } else if (!followUpTaskObj && lead.suggestedNextStep) {
    followUpTaskObj = {
      status: 'Pending',
      task: lead.suggestedNextStep || 'Review lead and follow up',
      created: createdLabel,
    }
  }

  const activities = (Array.isArray(lead.activities) ? lead.activities : []).map((a, idx) => ({
    id: a.id || a._id || `${id}-act-${idx}`,
    type: a.type || 'lead_created',
    title: a.title || 'Activity',
    description: a.description || '',
    time: a.time || (a.createdAt ? formatDate(new Date(a.createdAt)) : createdLabel),
    status: a.status || 'Active',
  }))

  const aiMetadata = lead.aiMetadata || {
    isRealAI: Boolean(typeof lead.aiAnalysis === 'object' && lead.aiAnalysis?.isRealAI),
    provider: lead.aiMetadata?.provider || 'fallback',
    model: lead.aiMetadata?.model || 'bounded-fallback-v1',
    leadQuality: lead.aiMetadata?.leadQuality || 'Medium',
    reasoningSummary: lead.aiMetadata?.reasoningSummary || '',
    humanReviewRequired: true,
  }

  const rawIntel = lead.aiIntelligence || {}
  const rawScore =
    typeof rawIntel.score === 'number'
      ? rawIntel.score
      : typeof lead.score === 'number'
        ? lead.score
        : lead.aiMetadata?.leadQuality === 'High'
          ? 85
          : lead.aiMetadata?.leadQuality === 'Low'
            ? 35
            : 65

  const rawPriority =
    rawIntel.priority ||
    lead.aiMetadata?.leadQuality ||
    (rawScore >= 75 ? 'High' : rawScore >= 50 ? 'Medium' : 'Low')
  const summaryText =
    rawIntel.summary ||
    (typeof lead.aiAnalysis === 'object' ? lead.aiAnalysis.summary : lead.aiAnalysis) ||
    ''

  const aiIntelligence = {
    score: Math.max(0, Math.min(100, Math.round(rawScore))),
    priority: ['High', 'Medium', 'Low'].includes(rawPriority) ? rawPriority : 'Medium',
    summary: summaryText,
    keySignals:
      Array.isArray(rawIntel.keySignals) && rawIntel.keySignals.length > 0
        ? rawIntel.keySignals
        : [
            lead.company ? `Company verified: ${lead.company}` : 'Direct individual account',
            lead.phone ? `Phone contact provided: ${lead.phone}` : 'Email inquiry',
            lead.email ? `Email: ${lead.email}` : null,
          ].filter(Boolean),
    risks:
      Array.isArray(rawIntel.risks) && rawIntel.risks.length > 0
        ? rawIntel.risks
        : [
            !lead.phone ? 'No phone number provided' : null,
            !lead.company ? 'No company name provided' : null,
            'Human review required prior to customer outreach',
          ].filter(Boolean),
    recommendedNextAction:
      rawIntel.recommendedNextAction ||
      lead.suggestedNextStep ||
      'Review lead profile and conduct discovery.',
    followUpSuggestion:
      rawIntel.followUpSuggestion ||
      `Hi ${lead.name}, thank you for connecting with BizFlow AI. Let us know a convenient time to discuss your workflow automation goals.`,
    analyzedAt: rawIntel.analyzedAt || lead.aiMetadata?.analyzedAt || createdDate.toISOString(),
    isRealAI: Boolean(rawIntel.isRealAI || lead.aiMetadata?.isRealAI),
    provider: rawIntel.provider || lead.aiMetadata?.provider || 'fallback',
    model: rawIntel.model || lead.aiMetadata?.model || 'bounded-fallback-v1',
    humanReviewRequired: true,
  }

  return {
    ...lead,
    id,
    createdLabel,
    aiAnalysis: aiAnalysisObj,
    aiMetadata,
    aiIntelligence,
    suggestedNextStep: lead.suggestedNextStep || aiIntelligence.recommendedNextAction,
    followUpTask: followUpTaskObj,
    activities,
    tasks: Array.isArray(lead.tasks) ? lead.tasks : [],
  }
}

function withStatusActivity(lead, nextStatus) {
  if (lead.status === nextStatus) {
    return lead
  }

  const time = formatDate(new Date())
  const activity = {
    id: `${lead.id}-status-${Date.now()}`,
    type: 'status_changed',
    title: 'Lead status updated',
    description: `Status changed from ${lead.status} to ${nextStatus}.`,
    time,
    status: nextStatus,
  }

  return {
    ...lead,
    activities: [activity, ...(lead.activities || [])],
  }
}

export function LeadsProvider({ children }) {
  const [leads, setLeads] = useState(initialLeads.map(normalizeLead))
  const [isLoading, setIsLoading] = useState(false)

  // Fetch leads from backend API
  useEffect(() => {
    let active = true

    async function loadLeads() {
      try {
        setIsLoading(true)
        const res = await leadsApi.getAll()
        if (active && res && res.success && Array.isArray(res.leads) && res.leads.length > 0) {
          setLeads(res.leads.map(normalizeLead))
        }
      } catch (err) {
        // Safe degradation to initial mock state if backend is offline or unauthenticated
        console.warn('[LeadsContext] Using initial state (API unavailable or unauthenticated):', err.message)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadLeads()

    return () => {
      active = false
    }
  }, [])

  const getLead = useCallback(
    (id) => leads.find((lead) => lead.id === id || lead._id === id) || null,
    [leads],
  )

  const addLead = useCallback(async (fields) => {
    let newLead = null
    try {
      const res = await leadsApi.create(fields)
      if (res && res.success && res.lead) {
        newLead = normalizeLead(res.lead)
      }
    } catch (err) {
      console.warn('[LeadsContext] API create lead failed, using local creation:', err.message)
    }

    if (!newLead) {
      newLead = normalizeLead(createLeadRecord(fields))
    }

    setLeads((current) => [newLead, ...current])
    return newLead
  }, [])

  const updateLead = useCallback(async (id, fields) => {
    let updated = null

    try {
      const res = await leadsApi.update(id, fields)
      if (res && res.success && res.lead) {
        updated = normalizeLead(res.lead)
      }
    } catch (err) {
      console.warn('[LeadsContext] API update lead failed, using local update:', err.message)
    }

    setLeads((current) =>
      current.map((lead) => {
        if (lead.id !== id && lead._id !== id) {
          return lead
        }

        if (updated) {
          return updated
        }

        const next = withStatusActivity(
          {
            ...lead,
            name: fields.name.trim(),
            email: fields.email?.trim() || '',
            phone: fields.phone?.trim() || '',
            company: fields.company?.trim() || '',
            status: fields.status,
            notes: fields.notes?.trim() || '',
            updatedAt: new Date().toISOString(),
          },
          fields.status,
        )
        updated = next
        return next
      }),
    )

    return updated
  }, [])

  const deleteLead = useCallback(async (id) => {
    try {
      await leadsApi.delete(id)
    } catch (err) {
      console.warn('[LeadsContext] API delete lead failed, deleting locally:', err.message)
    }

    setLeads((current) => current.filter((lead) => lead.id !== id && lead._id !== id))
  }, [])

  const analyzeLead = useCallback(async (id) => {
    try {
      const res = await leadsApi.analyze(id)
      if (res && res.success && res.lead) {
        const normalized = normalizeLead(res.lead)
        setLeads((current) =>
          current.map((lead) => (lead.id === id || lead._id === id ? normalized : lead)),
        )
        return { success: true, lead: normalized }
      }
      throw new Error(res?.message || 'Failed to analyze lead')
    } catch (err) {
      console.warn('[LeadsContext] API analyze lead failed:', err.message)
      throw err
    }
  }, [])

  const value = useMemo(
    () => ({ leads, getLead, addLead, updateLead, deleteLead, analyzeLead, isLoading }),
    [leads, getLead, addLead, updateLead, deleteLead, analyzeLead, isLoading],
  )

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>
}

export function useLeads() {
  const context = useContext(LeadsContext)
  if (!context) {
    throw new Error('useLeads must be used within LeadsProvider')
  }
  return context
}

export default LeadsContext
