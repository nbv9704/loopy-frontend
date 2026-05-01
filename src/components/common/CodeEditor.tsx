/**
 * CodeEditor — Wrapper around CodeMirror for lesson theory/exercise tabs.
 */

import { useState, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  editable?: boolean
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, editable = true }) => {
  const [fontSize, setFontSize] = useState(14)

  useEffect(() => {
    const saved = localStorage.getItem('editor_font_size')
    if (saved) setFontSize(parseInt(saved))

    const handleFontSizeChange = () => {
      const saved = localStorage.getItem('editor_font_size')
      if (saved) setFontSize(parseInt(saved))
    }

    window.addEventListener('fontSizeChanged', handleFontSizeChange)
    return () => window.removeEventListener('fontSizeChanged', handleFontSizeChange)
  }, [])

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={oneDark}
      extensions={[javascript()]}
      onChange={onChange}
      editable={editable}
      readOnly={!editable}
      className="h-full text-sm"
      style={{
        fontSize: `${fontSize}px`,
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
      }}
    />
  )
}

export default CodeEditor
