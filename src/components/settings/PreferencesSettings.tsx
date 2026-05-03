import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const PreferencesSettings = () => {
  const { t } = useTranslation()
  const [fontSize, setFontSize] = useState(14)

  useEffect(() => {
    const savedFontSize = localStorage.getItem('editor_font_size')

    if (savedFontSize) setFontSize(parseInt(savedFontSize))
  }, [])

  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    localStorage.setItem('editor_font_size', size.toString())
    window.dispatchEvent(new Event('fontSizeChanged'))
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-white font-bold text-2xl mb-8">{t('settings.customize')}</h2>

      {/* Font Size */}
      <div className="mb-8">
        <label className="text-slate-400 text-sm font-medium mb-3 block">
          {t('settings.editorFontSize', { size: fontSize })}
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="12"
            max="20"
            value={fontSize}
            onChange={e => handleFontSizeChange(Number(e.target.value))}
            className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-teal"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleFontSizeChange(12)}
              className="px-3 py-1 bg-white/5 border border-brand-teal/20 text-slate-400 text-xs rounded hover:border-brand-teal hover:text-brand-teal transition-all cursor-pointer"
            >
              12px
            </button>
            <button
              onClick={() => handleFontSizeChange(14)}
              className="px-3 py-1 bg-white/5 border border-brand-teal/20 text-slate-400 text-xs rounded hover:border-brand-teal hover:text-brand-teal transition-all cursor-pointer"
            >
              14px
            </button>
            <button
              onClick={() => handleFontSizeChange(16)}
              className="px-3 py-1 bg-white/5 border border-brand-teal/20 text-slate-400 text-xs rounded hover:border-brand-teal hover:text-brand-teal transition-all cursor-pointer"
            >
              16px
            </button>
            <button
              onClick={() => handleFontSizeChange(18)}
              className="px-3 py-1 bg-white/5 border border-brand-teal/20 text-slate-400 text-xs rounded hover:border-brand-teal hover:text-brand-teal transition-all cursor-pointer"
            >
              18px
            </button>
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-3">{t('settings.fontSizeHint')}</p>
      </div>

      {/* Preview */}
      <div className="bg-white/3 border border-brand-teal/10 rounded-card p-6">
        <p className="text-slate-400 text-sm font-medium mb-3">{t('settings.preview')}</p>
        <div className="bg-slate-900 border border-brand-teal/20 rounded p-4">
          <pre style={{ fontSize: `${fontSize}px` }} className="text-brand-teal font-mono">
            {`function hello() {
  console.log("Hello, World!");
  return true;
}`}
          </pre>
        </div>
      </div>
    </motion.div>
  )
}

export default PreferencesSettings
