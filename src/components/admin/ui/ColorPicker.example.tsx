import { useState } from 'react'
import ColorPicker from './ColorPicker'

/**
 * Example usage of the ColorPicker component
 *
 * This component demonstrates:
 * - Basic usage with label
 * - Required field indicator
 * - Error state
 * - Controlled component pattern
 */
const ColorPickerExample = () => {
  const [color1, setColor1] = useState('#54d9c4')
  const [color2, setColor2] = useState('#ff6b6b')
  const [color3, setColor3] = useState('#4a90e2')

  return (
    <div className="p-8 space-y-6 max-w-md">
      <h2 className="text-2xl font-bold mb-4">ColorPicker Examples</h2>

      {/* Basic usage */}
      <ColorPicker label="Primary Color" value={color1} onChange={setColor1} required />

      {/* With error */}
      <ColorPicker
        label="Accent Color"
        value={color2}
        onChange={setColor2}
        error="Invalid color format"
      />

      {/* Without label */}
      <ColorPicker value={color3} onChange={setColor3} />

      {/* Display selected colors */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Selected Colors:</h3>
        <div className="space-y-2 text-sm font-mono">
          <div>Primary: {color1}</div>
          <div>Accent: {color2}</div>
          <div>Color 3: {color3}</div>
        </div>
      </div>
    </div>
  )
}

export default ColorPickerExample
