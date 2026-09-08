import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} onClose={onClose}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      {children}
    </dialog>
  )
}
