import { useToastStore } from '../../store/toastStore'

const toneClass: Record<string, string> = {
  success: 'border-success/20 bg-success/5 text-success',
  error: 'border-danger/20 bg-danger/5 text-danger',
  info: 'border-neutral-200 bg-white text-neutral-800',
}

export function ToastViewport() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${toneClass[t.tone]}`}
          role="status"
        >
          <p className="flex-1 text-sm">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="text-xs opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
