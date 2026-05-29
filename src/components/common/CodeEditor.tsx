/**
 * CodeEditor — Wrapper around CodeMirror for lesson theory/exercise tabs.
 */

import { useState, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

const loopyDarkEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: '#020617',
    color: '#e2e8f0',
  },
  '.cm-content': {
    caretColor: '#54d9c4',
    color: '#e2e8f0',
  },
  '.cm-line': {
    color: 'inherit',
  },
  '.cm-gutters': {
    backgroundColor: '#020617',
    borderRight: '1px solid rgba(148, 163, 184, 0.16)',
    color: '#64748b',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(84, 217, 196, 0.08)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(84, 217, 196, 0.08)',
    color: '#54d9c4',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(84, 217, 196, 0.25)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
}, { dark: true })

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  editable?: boolean
  language?: string
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  editable = true,
  language = 'javascript',
}) => {
  const [fontSize, setFontSize] = useState(14)
  const [extensions, setExtensions] = useState<Extension[]>([])

  useEffect(() => {
    let isMounted = true
    const loadLanguage = async () => {
      try {
        let langExt: Extension
        switch (language.toLowerCase()) {
          case 'python':
            const { python } = await import('@codemirror/lang-python')
            langExt = python()
            break
          case 'cpp':
          case 'c++':
            const { cpp } = await import('@codemirror/lang-cpp')
            langExt = cpp()
            break
          case 'javascript':
          default:
            const { javascript } = await import('@codemirror/lang-javascript')
            langExt = javascript()
            break
        }
        if (isMounted) setExtensions([langExt])
      } catch (err) {
        console.error('Failed to load language extension', err)
      }
    }
    loadLanguage()
    return () => {
      isMounted = false
    }
  }, [language])

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
      extensions={[loopyDarkEditorTheme, ...extensions]}
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
