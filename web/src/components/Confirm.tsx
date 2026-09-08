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
          <p style={{ marginTop: 0 }}>{pending.options.message}</p>
        )}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="ghost" onClick={() => settle(false)}>
            {pending?.options.cancelLabel ?? 'Cancel'}
          </button>
          <button
            type="button"
            className={pending?.options.danger ? 'danger' : 'primary'}
            onClick={() => settle(true)}
          >
            {pending?.options.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}
