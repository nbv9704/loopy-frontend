import { useState } from 'react'
import Select from './Select'

/**
 * Example usage of the Select component
 * This file demonstrates the component's features and is not used in production
 */

export default function SelectExample() {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const languageOptions = [
    { value: '', label: 'Select a language...' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue(e.target.value)
    if (e.target.value) {
      setError('')
    } else {
      setError('Please select a language')
    }
  }

  return (
    <div className="p-8 max-w-md space-y-6">
      <h2 className="text-2xl font-bold">Select Component Examples</h2>

      {/* Basic Select */}
      <Select
        label="Programming Language"
        options={languageOptions}
        value={value}
        onChange={handleChange}
      />

      {/* Required Select */}
      <Select
        label="Required Field"
        options={languageOptions}
        required
        value={value}
        onChange={handleChange}
      />

      {/* Select with Error */}
      <Select
        label="With Error"
        options={languageOptions}
        error={error}
        value={value}
        onChange={handleChange}
      />

      {/* Disabled Select */}
      <Select label="Disabled" options={languageOptions} disabled value="javascript" />
    </div>
  )
}
