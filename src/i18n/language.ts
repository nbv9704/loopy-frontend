export type InterfaceLanguage = 'en' | 'vi'

export function interfaceLanguage(value: string | null | undefined): InterfaceLanguage {
  return value === 'vi' ? 'vi' : 'en'
}
