import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  confirming?: boolean
  danger?: boolean
}

export function Modal({
  open,
  title,
  children,
  onClose,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  confirming,
  danger,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    cancelRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-950/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-md rounded-xl border border-neutral-100 bg-white p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="font-display text-xl text-neutral-900">
          {title}
        </h2>
        <div className="mt-3 text-sm text-neutral-600">{children}</div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {cancelLabel}
          </button>
          {onConfirm && (
            <button
              type="button"
              disabled={confirming}
              onClick={onConfirm}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold text-white transition disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                danger
                  ? 'bg-danger hover:bg-danger/90 focus-visible:ring-danger'
                  : 'bg-primary hover:bg-primary-light focus-visible:ring-accent'
              }`}
            >
              {confirming ? 'Working…' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
