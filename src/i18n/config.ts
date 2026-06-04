import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import vi from './locales/vi.json'
import en from './locales/en.json'

// Get saved language from localStorage or default to Vietnamese
const savedLanguage = localStorage.getItem('language') || 'vi'

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: savedLanguage,
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
})

// Save language preference when it changes
i18n.on('languageChanged', lng => {
  localStorage.setItem('language', lng)
  document.documentElement.lang = lng
})

export default i18n
