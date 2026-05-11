import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SiJavascript, SiPython, SiCplusplus } from 'react-icons/si'
import { Code2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SEO from '../components/common/SEO'
import { pageMetadata } from '../utils/seo'
import { api } from '../lib/api'
import FullscreenLoader from '../components/common/FullscreenLoader'

const iconMap: Record<string, any> = {
  javascript: SiJavascript,
  python: SiPython,
  cpp: SiCplusplus,
}

const colorMap: Record<string, string> = {
  javascript: 'teal',
  python: 'cyan',
  cpp: 'ocean',
}

const LanguageSelectorPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [languages, setLanguages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await api.getLanguages()
        if (response.success && response.data) {
          const languagesData =
            (response.data as { languages: Record<string, unknown>[] }).languages || []
          setLanguages(languagesData)
        }
      } catch (error) {
        console.error('Error loading languages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLanguages()
  }, [])

  const handleSelect = (langId: string) => {
    setTimeout(() => {
      navigate(`/learn/${langId}`)
    }, 200)
  }

  if (loading) {
    return <FullscreenLoader message={t('languageSelector.loading')} />
  }

  if (languages.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-teal/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-red-500/10 rounded-full blur-[80px]" />
        </div>

        <div className="text-center relative z-10">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Code2 className="w-12 h-12 text-red-400" />
            </div>
          </div>
          <h3 className="text-red-400 font-bold text-2xl mb-3">
            {t('languageSelector.errorTitle')}
          </h3>
          <p className="text-slate-400 text-base">{t('languageSelector.errorMessage')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO {...pageMetadata.learn} />
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-[100px] animate-pulse"
            style={{ animationDelay: '1s' }}
          />
          <div
            className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-brand-ocean/10 rounded-full blur-[80px] animate-pulse"
            style={{ animationDelay: '2s' }}
          />
        </div>

        <div className="text-center relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 flex items-center justify-center gap-4">
              <Code2 className="w-12 h-12 text-brand-teal" />
              {t('languageSelector.title')}
            </h1>
            <p className="text-slate-400 text-lg">{t('languageSelector.subtitle')}</p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
            {languages.map((lang, index) => {
              const Icon = iconMap[lang.id] || SiJavascript
              const color = colorMap[lang.id] || 'teal'

              const borderColorClass =
                color === 'teal'
                  ? 'hover:border-brand-teal/50'
                  : color === 'cyan'
                    ? 'hover:border-brand-cyan/50'
                    : color === 'ocean'
                      ? 'hover:border-brand-ocean/50'
                      : 'hover:border-brand-teal/50'

              const textColorClass =
                color === 'teal'
                  ? 'text-brand-teal'
                  : color === 'cyan'
                    ? 'text-brand-cyan'
                    : color === 'ocean'
                      ? 'text-brand-ocean'
                      : 'text-brand-teal'

              const glowColorClass =
                color === 'teal'
                  ? 'group-hover:shadow-brand-teal/20'
                  : color === 'cyan'
                    ? 'group-hover:shadow-brand-cyan/20'
                    : color === 'ocean'
                      ? 'group-hover:shadow-brand-ocean/20'
                      : 'group-hover:shadow-brand-teal/20'

              return (
                <motion.button
                  key={lang.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.15, duration: 0.4 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onClick={() => handleSelect(lang.id)}
                  className={`group relative rounded-2xl w-full md:w-64 h-80 bg-white/5 backdrop-blur-sm border border-white/10 ${borderColorClass} hover:bg-white/10 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-8 overflow-hidden`}
                >
                  {/* Glow effect */}
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${glowColorClass} shadow-2xl`}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="transform group-hover:scale-110 transition-transform duration-300">
                      <Icon className={`text-7xl ${textColorClass}`} />
                    </div>
                    <div>
                      <h2 className={`${textColorClass} font-bold text-3xl mb-2`}>
                        {lang.display_name}
                      </h2>
                      <p className="text-slate-400 text-sm">{lang.name}</p>
                    </div>
                  </div>

                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

export default LanguageSelectorPage
