import { useCallback, useState, type ReactNode } from 'react'
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from '../hooks/confirm'
import { Modal } from './Modal'

interface PendingConfirm {
  options: ConfirmOptions
  resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => setPending({ options, resolve })),
    [],
  )

  const settle = (value: boolean) => {
    pending?.resolve(value)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={pending !== null}
        onClose={() => settle(false)}
        title={pending?.options.title ?? ''}
      >
        {pending?.options.message && (
          <p className="mt-0 text-sm text-slate-600">{pending.options.message}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => settle(false)}>
            {pending?.options.cancelLabel ?? 'Cancel'}
          </button>
          <button
            type="button"
            className={`btn ${pending?.options.danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => settle(true)}
          >
            {pending?.options.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}
