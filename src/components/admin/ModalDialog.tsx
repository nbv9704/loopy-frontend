import { ReactNode, useEffect, useRef } from 'react'

/** Native modal owns background inertness, Escape and focus restoration. */
export default function ModalDialog({
  open,
  onClose,
  dismissible = true,
  label,
  id,
  className,
  children,
}: {
  open: boolean
  onClose: () => void
  dismissible?: boolean
  label: string
  id?: string
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open && ref.current && !ref.current.open) ref.current.showModal()
    else if (!open && ref.current?.open) ref.current.close()
  }, [open])
  useEffect(() => {
    const element = ref.current
    return () => element?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      id={id}
      aria-label={label}
      className={className}
      onCancel={event => {
        event.preventDefault()
        if (dismissible) onClose()
      }}
      onClose={() => {
        if (!ref.current?.open) onClose()
      }}
      onClick={event => {
        if (dismissible && event.target === event.currentTarget) onClose()
      }}
    >
      {children}
    </dialog>
  )
}
