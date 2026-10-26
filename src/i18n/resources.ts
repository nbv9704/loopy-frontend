import en from './locales/en.json'
import vi from './locales/vi.json'
import enInterface from './locales/en-interface.json'
import viInterface from './locales/vi-interface.json'

// Flat supplementary keys preserve legacy nested labels that are also namespace prefixes.
export const interfaceTranslations = {
  en: { ...en, ...enInterface },
  vi: { ...vi, ...viInterface },
}
