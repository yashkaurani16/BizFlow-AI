import { useEffect, useRef } from 'react'
import Button from './Button.jsx'

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    cancelRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel?.()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) {
    return null
  }

  return (
    <div className="modal-overlay" role="presentation">
      <button type="button" className="overlay" aria-label="Close dialog" onClick={onCancel} />
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onCancel} ref={cancelRef}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
