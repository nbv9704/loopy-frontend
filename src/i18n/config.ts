import { readBrowserStorage, writeBrowserStorage } from '../lib/browserStorage'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { interfaceTranslations } from './resources'
import { interfaceLanguage } from './language'

// An explicit saved preference wins; first visits/invalid storage use English.
const savedLanguage = interfaceLanguage(readBrowserStorage('language'))
document.documentElement.lang = savedLanguage

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: interfaceTranslations.vi },
    en: { translation: interfaceTranslations.en },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  supportedLngs: ['en', 'vi'],
  interpolation: {
    escapeValue: false,
  },
})

// Save language preference when it changes
i18n.on('languageChanged', lng => {
  writeBrowserStorage('language', lng)
  document.documentElement.lang = lng
})

export default i18n
