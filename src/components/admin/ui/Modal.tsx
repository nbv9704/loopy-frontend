import { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../../utils/admin/cn'
import { IoClose } from 'react-icons/io5'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hasUnsavedChanges?: boolean
  isLoading?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  hasUnsavedChanges = false,
  isLoading = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?')
      if (!confirmed) return
    }
    onClose()
  }

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, hasUnsavedChanges])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = ''
        // Restore focus to the element that opened the modal
        previousActiveElement.current?.focus()
      }
    }
  }, [isOpen])

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const modal = modalRef.current
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element when modal opens
    firstElement?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    modal.addEventListener('keydown', handleTab)
    return () => modal.removeEventListener('keydown', handleTab)
  }, [isOpen])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-body"
    >
      {/* Backdrop with fade-in animation */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        style={{ zIndex: 50 }}
      />

      {/* Modal content with fade-in and scale animation */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full bg-white rounded-xl shadow-2xl',
          'transform transition-all duration-300',
          'animate-modal-in',
          sizeClasses[size]
        )}
        style={{ zIndex: 51 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-accent/5">
          <h2 id="modal-title" className="text-xl font-bold text-gray-900">
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            aria-label="Close modal"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div id="modal-body" className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div
            className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10"
            role="status"
            aria-live="polite"
            aria-label="Saving content"
          >
            <div className="flex flex-col items-center gap-3">
              <AiOutlineLoading3Quarters className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-gray-700">Saving...</p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
