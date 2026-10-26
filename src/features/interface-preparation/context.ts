import { createContext, useContext } from 'react'
import type { InterfaceLanguage } from '../../i18n/language'

interface InterfacePreparationContext {
  changeLanguage: (language: InterfaceLanguage) => void
  preparing: boolean
}

export const InterfacePreparationContext = createContext<InterfacePreparationContext | null>(null)

export function useInterfacePreparation() {
  const context = useContext(InterfacePreparationContext)
  if (!context) throw new Error('Language controls require interface preparation')
  return context
}
