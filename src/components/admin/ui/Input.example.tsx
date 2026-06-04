/**
 * Input Component - ARIA Accessibility Example
 *
 * This example demonstrates the ARIA attributes added for accessibility:
 * - aria-describedby: Associates error messages with the input
 * - aria-invalid: Indicates validation state
 * - aria-required: Indicates required fields
 * - role="alert": Announces errors to screen readers
 */

import { useState } from 'react'
import Input from './Input'

export default function InputExample() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleBlur = () => {
    if (!email) {
      setError('Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
    } else {
      setError('')
    }
  }

  return (
    <div className="max-w-md p-8 space-y-6">
      <h2 className="text-2xl font-bold">Input Component - ARIA Example</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Valid Input</h3>
        <Input
          label="Username"
          placeholder="Enter your username"
          helperText="Choose a unique username"
          required
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Input with Error</h3>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={handleBlur}
          error={error}
          placeholder="Enter your email"
          required
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Disabled Input</h3>
        <Input label="Account ID" value="12345" disabled helperText="This field cannot be edited" />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-blue-900">ARIA Attributes Added:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            <code>aria-describedby</code> - Links error/helper text to input
          </li>
          <li>
            <code>aria-invalid</code> - Indicates validation state (true/false)
          </li>
          <li>
            <code>aria-required</code> - Marks required fields
          </li>
          <li>
            <code>role="alert"</code> - Announces errors immediately
          </li>
          <li>
            <code>htmlFor</code> - Associates label with input
          </li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-green-900">Screen Reader Behavior:</h4>
        <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
          <li>Label is announced when field receives focus</li>
          <li>Required indicator (*) is announced</li>
          <li>Helper text is read after the label</li>
          <li>Error messages are announced immediately when they appear</li>
          <li>Validation state (invalid/valid) is communicated</li>
        </ul>
      </div>
    </div>
  )
}
