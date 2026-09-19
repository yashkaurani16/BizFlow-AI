import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createLeadRecord, initialLeads } from '../data/leadsData.js'
import { formatDate } from '../utils/dates.js'

const LeadsContext = createContext(null)

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
    activities: [activity, ...lead.activities],
  }
}

export function LeadsProvider({ children }) {
  const [leads, setLeads] = useState(initialLeads)

  const getLead = useCallback((id) => leads.find((lead) => lead.id === id) || null, [leads])

  const addLead = useCallback((fields) => {
    const lead = createLeadRecord(fields)
    setLeads((current) => [lead, ...current])
    return lead
  }, [])

  const updateLead = useCallback((id, fields) => {
    let updated = null
    setLeads((current) =>
      current.map((lead) => {
        if (lead.id !== id) {
          return lead
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

  const deleteLead = useCallback((id) => {
    setLeads((current) => current.filter((lead) => lead.id !== id))
  }, [])

  const value = useMemo(
    () => ({ leads, getLead, addLead, updateLead, deleteLead }),
    [leads, getLead, addLead, updateLead, deleteLead],
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
