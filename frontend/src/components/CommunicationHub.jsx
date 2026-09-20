import { useState } from 'react'
import Alert from './Alert.jsx'
import Button from './Button.jsx'
import SectionCard from './SectionCard.jsx'
import { communicationsApi } from '../services/api.js'

const CHANNELS = [
  { id: 'email', label: 'Email', icon: '✉️', recipientLabel: 'Recipient Email' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬', recipientLabel: 'WhatsApp Phone (+E.164)' },
  { id: 'sms', label: 'SMS', icon: '📱', recipientLabel: 'Mobile Phone (+E.164)' },
]

function CommunicationHub({ lead, onCommunicationSent }) {
  const [activeChannel, setActiveChannel] = useState('email')
  const [customRecipient, setCustomRecipient] = useState(null)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [humanApproved, setHumanApproved] = useState(false)
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [aiDraftNotice, setAiDraftNotice] = useState('')

  const [isDrafting, setIsDrafting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const defaultRecipient = activeChannel === 'email' ? lead?.email || '' : lead?.phone || ''
  const recipient = customRecipient !== null ? customRecipient : defaultRecipient

  function handleChannelSwitch(channelId) {
    setActiveChannel(channelId)
    setCustomRecipient(null)
    setHumanApproved(false)
    setStatusMessage(null)
    setErrorMessage('')
  }

  async function handleGenerateDraft() {
    try {
      setIsDrafting(true)
      setErrorMessage('')
      setStatusMessage(null)

      const res = await communicationsApi.generateDraft({
        leadId: lead.id || lead._id,
        channel: activeChannel,
      })

      if (res && res.success && res.draft) {
        if (activeChannel === 'email' && res.draft.subject) {
          setSubject(res.draft.subject)
        }
        setContent(res.draft.body || '')
        setIsAiGenerated(true)
        setAiDraftNotice(res.draft.notice || 'AI Generated — Requires Human Review')
        // Enforce re-checking explicit human approval after generating draft
        setHumanApproved(false)

        // Notify parent to log draft creation in activity audit trail
        if (res.activity && typeof onCommunicationSent === 'function') {
          onCommunicationSent(res.activity)
        }
      } else {
        throw new Error(res?.message || 'Failed to generate draft')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error generating AI draft.')
    } finally {
      setIsDrafting(false)
    }
  }

  async function handleSend() {
    if (!humanApproved) {
      setErrorMessage('Explicit human review and approval is required before sending.')
      return
    }

    if (!recipient.trim()) {
      setErrorMessage(`Please provide a valid ${activeChannel === 'email' ? 'email address' : 'phone number'}.`)
      return
    }

    if (activeChannel === 'email' && !subject.trim()) {
      setErrorMessage('Subject line is required for email communication.')
      return
    }

    if (!content.trim()) {
      setErrorMessage('Message body cannot be empty.')
      return
    }

    try {
      setIsSending(true)
      setErrorMessage('')
      setStatusMessage(null)

      const payload = {
        leadId: lead.id || lead._id,
        channel: activeChannel,
        recipient: recipient.trim(),
        subject: activeChannel === 'email' ? subject.trim() : undefined,
        content: content.trim(),
        humanApproved: true,
        isAiGenerated,
      }

      const res = await communicationsApi.send(payload)

      if (res && res.success) {
        setStatusMessage({
          tone: 'success',
          text: `${activeChannel.toUpperCase()} dispatched successfully to ${recipient.trim()}. (${res.result?.messageId || 'Delivered'})`,
        })

        // Reset form content after successful dispatch
        setContent('')
        setSubject('')
        setHumanApproved(false)
        setIsAiGenerated(false)
        setAiDraftNotice('')

        // Notify parent to refresh activity audit log
        if (typeof onCommunicationSent === 'function') {
          onCommunicationSent(res.activity)
        }
      } else {
        throw new Error(res?.message || 'Communication dispatch failed')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to dispatch communication.')
    } finally {
      setIsSending(false)
    }
  }

  function handleReset() {
    setContent('')
    setSubject('')
    setHumanApproved(false)
    setIsAiGenerated(false)
    setAiDraftNotice('')
    setErrorMessage('')
    setStatusMessage(null)
  }

  const currentChannel = CHANNELS.find((c) => c.id === activeChannel)
  const isSendDisabled =
    !humanApproved ||
    !recipient.trim() ||
    !content.trim() ||
    (activeChannel === 'email' && !subject.trim()) ||
    isSending

  return (
    <SectionCard
      title="Communication Hub"
      className="comm-hub-card"
      actions={
        <div className="comm-channel-tabs" role="tablist">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              role="tab"
              aria-selected={activeChannel === ch.id}
              className={`comm-tab-btn ${activeChannel === ch.id ? 'active' : ''}`}
              onClick={() => handleChannelSwitch(ch.id)}
            >
              <span className="tab-icon">{ch.icon}</span>
              <span>{ch.label}</span>
            </button>
          ))}
        </div>
      }
    >
      <div className="comm-hub-body">
        {/* Status / Alert Messages */}
        {statusMessage && (
          <Alert tone={statusMessage.tone}>{statusMessage.text}</Alert>
        )}
        {errorMessage && (
          <Alert tone="error">{errorMessage}</Alert>
        )}

        {/* Recipient row */}
        <div className="comm-form-row">
          <label htmlFor="comm-recipient" className="comm-label">
            {currentChannel?.recipientLabel}:
          </label>
          <input
            id="comm-recipient"
            type="text"
            className="input comm-input"
            value={recipient}
            onChange={(e) => setCustomRecipient(e.target.value)}
            placeholder={
              activeChannel === 'email'
                ? 'lead@company.com'
                : '+14155552671'
            }
          />
          <Button
            variant="secondary"
            className="comm-draft-btn"
            onClick={handleGenerateDraft}
            disabled={isDrafting}
          >
            {isDrafting ? 'Drafting with AI...' : '✨ Generate AI Draft'}
          </Button>
        </div>

        {/* AI Draft Banner */}
        {isAiGenerated && (
          <div className="comm-ai-banner">
            <div className="comm-ai-badge">
              <span className="badge-dot" />
              <span>{aiDraftNotice || 'AI Generated — Requires Human Review'}</span>
            </div>
            <p className="comm-ai-explainer">
              Draft generated from CRM lead details. Carefully review and personalize before approving.
              This message will <strong>NOT</strong> be sent automatically.
            </p>
          </div>
        )}

        {/* Email Subject Line */}
        {activeChannel === 'email' && (
          <div className="comm-form-group">
            <label htmlFor="comm-subject" className="comm-label">
              Subject Line:
            </label>
            <input
              id="comm-subject"
              type="text"
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Exploring workflow automation for your team"
            />
          </div>
        )}

        {/* Message Content Area */}
        <div className="comm-form-group">
          <div className="comm-textarea-header">
            <label htmlFor="comm-content" className="comm-label">
              Message Content:
            </label>
            {activeChannel === 'sms' && (
              <span
                className={`comm-char-count ${
                  content.length > 160 ? 'warning' : ''
                }`}
              >
                {content.length} / 160 chars {content.length > 160 ? '(multi-segment)' : ''}
              </span>
            )}
          </div>
          <textarea
            id="comm-content"
            className="input comm-textarea"
            rows={activeChannel === 'sms' ? 4 : 7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              activeChannel === 'email'
                ? 'Compose your professional email follow-up...'
                : activeChannel === 'whatsapp'
                  ? 'Compose your conversational WhatsApp message...'
                  : 'Compose concise SMS outreach (160 chars max recommended)...'
            }
          />
        </div>

        {/* Human Review & Approval Requirement */}
        <div className="comm-approval-box">
          <label className="comm-approval-checkbox-label">
            <input
              id="human-approval-checkbox"
              type="checkbox"
              checked={humanApproved}
              onChange={(e) => setHumanApproved(e.target.checked)}
              className="comm-checkbox"
            />
            <span className="comm-approval-text">
              <strong>Human Review & Approval:</strong> I have reviewed this message and explicitly
              authorize sending it to <code>{recipient || '(no recipient specified)'}</code>.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="comm-actions">
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={isSendDisabled}
            className="comm-send-btn"
          >
            {isSending ? 'Sending...' : `Approve & Send ${currentChannel?.label}`}
          </Button>
          {(content || subject || isAiGenerated) && (
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={isSending}
            >
              Discard Draft
            </Button>
          )}
        </div>
      </div>
    </SectionCard>
  )
}

export default CommunicationHub
