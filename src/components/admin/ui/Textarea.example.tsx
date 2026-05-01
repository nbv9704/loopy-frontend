import { useState } from 'react'
import Textarea from './Textarea'

/**
 * Example usage of the Textarea component
 * This file demonstrates the various props and states
 */
export default function TextareaExample() {
  const [value, setValue] = useState('')
  const [errorValue, setErrorValue] = useState('')

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Textarea Component Examples</h2>

      {/* Basic textarea */}
      <Textarea
        label="Description"
        placeholder="Enter description..."
        rows={3}
        value={value}
        onChange={e => setValue(e.target.value)}
      />

      {/* With helper text */}
      <Textarea
        label="Bio"
        helperText="Tell us about yourself (max 500 characters)"
        placeholder="Write your bio..."
        rows={4}
        maxLength={500}
      />

      {/* Required field */}
      <Textarea label="Comments" required placeholder="Your comments are required..." rows={3} />

      {/* With error */}
      <Textarea
        label="Feedback"
        error="This field is required"
        placeholder="Enter your feedback..."
        rows={3}
        value={errorValue}
        onChange={e => setErrorValue(e.target.value)}
      />

      {/* Disabled state */}
      <Textarea label="Read-only Content" disabled value="This content cannot be edited" rows={2} />

      {/* Large textarea */}
      <Textarea
        label="Article Content"
        helperText="Write your article content here"
        placeholder="Start writing..."
        rows={8}
      />
    </div>
  )
}
