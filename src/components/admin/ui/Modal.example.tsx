/**
 * Modal Component - Usage Examples
 *
 * This file demonstrates how to use the Modal component in different scenarios.
 * DO NOT import this file in production code - it's for reference only.
 */

import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'

// Example 1: Basic Modal
export function BasicModalExample() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Basic Modal" size="md">
        <p>This is a basic modal with default settings.</p>
      </Modal>
    </>
  )
}

// Example 2: Modal with Form and Unsaved Changes Warning
export function FormModalExample() {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [isDirty, setIsDirty] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSubmit = () => {
    // Submit form logic here
    console.log('Form submitted:', formData)
    setIsDirty(false)
    setIsOpen(false)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Form Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false)
          setIsDirty(false)
          setFormData({ name: '', email: '' })
        }}
        title="Edit User"
        size="md"
        hasUnsavedChanges={isDirty}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={e => handleInputChange('email', e.target.value)}
            required
          />

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSubmit}>Save Changes</Button>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// Example 3: Different Modal Sizes
export function ModalSizesExample() {
  const [size, setSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            setSize('sm')
            setIsOpen(true)
          }}
        >
          Small
        </Button>
        <Button
          onClick={() => {
            setSize('md')
            setIsOpen(true)
          }}
        >
          Medium
        </Button>
        <Button
          onClick={() => {
            setSize('lg')
            setIsOpen(true)
          }}
        >
          Large
        </Button>
        <Button
          onClick={() => {
            setSize('xl')
            setIsOpen(true)
          }}
        >
          Extra Large
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`${size.toUpperCase()} Modal`}
        size={size}
      >
        <p>This is a {size} sized modal.</p>
        <p className="mt-2 text-gray-600">
          Available sizes: sm (max-w-md), md (max-w-lg), lg (max-w-2xl), xl (max-w-4xl)
        </p>
      </Modal>
    </>
  )
}

// Example 4: Modal with react-hook-form Integration
export function ReactHookFormModalExample() {
  const [isOpen, setIsOpen] = useState(false)

  // In real usage, you would use react-hook-form:
  // const { register, handleSubmit, formState: { isDirty } } = useForm()

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Form</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create Item"
        size="lg"
        // hasUnsavedChanges={formState.isDirty} // Use react-hook-form's isDirty
      >
        <form>
          {/* Form fields here */}
          <p className="text-gray-600">
            When using react-hook-form, pass formState.isDirty to hasUnsavedChanges prop
          </p>
        </form>
      </Modal>
    </>
  )
}

/**
 * Key Features:
 *
 * 1. Backdrop Click to Close
 *    - Click outside the modal to close it
 *    - Shows warning if hasUnsavedChanges is true
 *
 * 2. ESC Key Handler
 *    - Press ESC to close the modal
 *    - Also respects unsaved changes warning
 *
 * 3. Focus Trap
 *    - Tab navigation stays within the modal
 *    - Shift+Tab cycles backwards
 *    - Focus returns to trigger element on close
 *
 * 4. Smooth Animations
 *    - Fade-in backdrop (300ms)
 *    - Scale + fade-in modal content (300ms)
 *    - Uses CSS animations defined in index.css
 *
 * 5. React Portal
 *    - Renders at document.body level
 *    - Prevents z-index issues
 *    - Backdrop: z-index 50, Modal: z-index 51
 *
 * 6. Accessibility
 *    - role="dialog" and aria-modal="true"
 *    - aria-labelledby links to title
 *    - aria-label on close button
 *    - Prevents body scroll when open
 *
 * 7. Responsive Sizing
 *    - sm: max-w-md (28rem)
 *    - md: max-w-lg (32rem)
 *    - lg: max-w-2xl (42rem)
 *    - xl: max-w-4xl (56rem)
 */
