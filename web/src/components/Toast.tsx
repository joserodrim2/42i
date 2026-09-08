import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  ToastContext,
  type ToastApi,
  type ToastItem,
  type ToastKind,
} from '../hooks/toast'

let nextId = 0

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
      <div className="toast-stack" role="region" aria-live="polite">
        {items.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`toast toast-${t.kind}`}
            onClick={() => dismiss(t.id)}
            title="Dismiss"
          >
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
