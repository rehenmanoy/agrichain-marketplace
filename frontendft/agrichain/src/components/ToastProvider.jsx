import { useCallback, useRef, useState } from 'react'
import { CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { ToastContext } from './toast-context'

const VISIBLE_MS = 4500

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const toast = useCallback((message, tone = 'success') => {
    const id = ++nextId.current
    setToasts((list) => [...list, { id, message, tone }])
    setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), VISIBLE_MS)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed right-6 bottom-6 z-50 flex w-full max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {toasts.map(({ id, message, tone }) => (
          <div
            key={id}
            className={`flex animate-[toast-in_180ms_ease-out] items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ${
              tone === 'error' ? 'bg-danger text-white' : 'bg-forest text-white'
            }`}
          >
            {tone === 'error' ? (
              <WarningCircleIcon size={20} className="shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircleIcon size={20} className="shrink-0" aria-hidden="true" />
            )}
            <span>{message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
