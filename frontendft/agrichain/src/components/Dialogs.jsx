import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@phosphor-icons/react'
import { Button } from './Button'

/** Opens/closes a native <dialog> with the `open` prop; Esc and backdrop clicks call onClose */
function useNativeDialog(open, onClose) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const handlers = {
    onCancel: (e) => {
      e.preventDefault()
      onClose()
    },
    onClick: (e) => {
      if (e.target === ref.current) onClose()
    },
  }
  return [ref, handlers]
}

/** Side panel sliding in from the right, used for forms (sell, edit, book) */
export function Panel({ open, onClose, title, subtitle, footer, children }) {
  const { t } = useTranslation()
  const titleId = useId()
  const [ref, handlers] = useNativeDialog(open, onClose)

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      {...handlers}
      className="my-0 mr-0 ml-auto h-dvh max-h-none w-full max-w-xl bg-transparent p-0 open:animate-[panel-in_200ms_ease-out]"
    >
      {open && (
        <div className="flex h-full flex-col bg-white shadow-2xl">
          <header className="flex items-start justify-between gap-4 border-b border-line px-8 py-6">
            <div>
              <h2 id={titleId} className="text-2xl text-ink">
                {title}
              </h2>
              {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-sage hover:text-forest"
              aria-label={t('common.close')}
            >
              <XIcon size={18} weight="bold" aria-hidden="true" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-8 py-6">{children}</div>
          {footer && <footer className="border-t border-line px-8 py-5">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}

/**
 * Yes / Cancel question before anything that can't be undone. The cancel button closes the
 * dialog unless onCancel / cancelLabel give it another job (Esc and the backdrop always call onClose).
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  onCancel = onClose,
  title,
  body,
  confirmLabel,
  cancelLabel,
  loading,
  tone = 'danger',
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const [ref, handlers] = useNativeDialog(open, onClose)

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      {...handlers}
      className="m-auto w-full max-w-md rounded-2xl bg-white p-0 shadow-2xl"
    >
      {open && (
        <div className="p-7">
          <h2 id={titleId} className="text-xl text-ink">
            {title}
          </h2>
          {body && <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>}
          <div className="mt-7 flex justify-end gap-3">
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
              {cancelLabel ?? t('common.cancel')}
            </Button>
            <Button
              variant={tone === 'danger' ? 'destructive' : 'primary'}
              onClick={onConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  )
}
