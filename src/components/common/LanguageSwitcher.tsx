import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark'
}

const LanguageSwitcher = ({ variant = 'dark' }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi'
    i18n.changeLanguage(newLang)
  }

  const baseClasses = "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300"
  const themeClasses = variant === 'light'
    ? "loopy-surface-soft loopy-border loopy-muted hover:border-brand-teal/50 hover:text-brand-teal"
    : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-brand-teal/50 text-slate-300 hover:text-brand-teal"

  return (
    <button
      onClick={toggleLanguage}
      className={`${baseClasses} ${themeClasses}`}
      title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium uppercase">{i18n.language}</span>
    </button>
  )
}

export default LanguageSwitcher
