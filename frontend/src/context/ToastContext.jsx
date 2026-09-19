import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ id: Date.now(), message, tone })
  }, [])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <div className={`toast toast-${toast.tone}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return context
}
