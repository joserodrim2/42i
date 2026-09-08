import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  ToastContext,
  type ToastApi,
  type ToastItem,
  type ToastKind,
} from '../hooks/toast'

let nextId = 0

const BORDER: Record<ToastKind, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  info: 'border-l-brand-500',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((t) => t.id !== id))
  }, [])

  const api = useMemo<ToastApi>(() => {
    const toast = (message: string, kind: ToastKind = 'info') => {
      const id = ++nextId
      setItems((current) => [...current, { id, kind, message }])
      window.setTimeout(() => dismiss(id), 4500)
    }
    return {
      toast,
      success: (message) => toast(message, 'success'),
      error: (message) => toast(message, 'error'),
    }
  }, [dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
        role="region"
        aria-live="polite"
      >
        {items.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            title="Dismiss"
            className={`animate-toast-in cursor-pointer rounded-lg border border-slate-200 border-l-4 bg-white px-3.5 py-2.5 text-left text-sm text-slate-800 shadow-lg hover:bg-slate-50 ${BORDER[t.kind]}`}
          >
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
