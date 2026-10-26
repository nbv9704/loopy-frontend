import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { interfaceLanguage, type InterfaceLanguage } from '../../i18n/language'
import { useContentCacheRevision } from '../../hooks/useContentCacheRevision'
import { prepareInterface } from './prepare'
import { InterfacePreparationContext } from './context'
import InterfaceLoadingScreen from './InterfaceLoadingScreen'

export default function InterfacePreparation({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const revision = useContentCacheRevision()
  const [ready, setReady] = useState(false)
  const [state, setState] = useState({
    language: interfaceLanguage(i18n.language),
    preparing: true,
    error: false,
  })
  const request = useRef(0)
  const currentI18n = useRef(i18n)
  currentI18n.current = i18n
  const content = useRef<HTMLDivElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const changeLanguage = useCallback((language: InterfaceLanguage) => {
    if (!returnFocus.current && document.activeElement instanceof HTMLElement)
      returnFocus.current = document.activeElement
    const owner = ++request.current
    setState({ language, preparing: true, error: false })
    void prepareInterface(language)
      .then(async () => {
        if (request.current !== owner) return
        await currentI18n.current.changeLanguage(language)
        if (request.current !== owner) return
        setReady(true)
        setState({ language, preparing: false, error: false })
      })
      .catch(() => {
        if (request.current === owner) setState({ language, preparing: false, error: true })
      })
  }, [])

  useEffect(() => {
    if (!ready || state.preparing) changeLanguage(state.language)
    else
      void prepareInterface(interfaceLanguage(currentI18n.current.language)).catch(() => undefined)
    // A CMS edit refreshes prepared copy in the background; it must not hide a mounted draft.
    // Language changes are explicitly started through changeLanguage, not by every render.
  }, [revision, changeLanguage])

  useEffect(
    () => () => {
      request.current++
    },
    []
  )

  const blocked = !ready || state.preparing || state.error
  useLayoutEffect(() => {
    content.current?.toggleAttribute('inert', blocked)
    if (!blocked) {
      if (returnFocus.current?.isConnected) returnFocus.current.focus()
      returnFocus.current = null
      return
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    screen.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [blocked])
  const value = useMemo(() => ({ changeLanguage, preparing: blocked }), [changeLanguage, blocked])

  return (
    <InterfacePreparationContext.Provider value={value}>
      <div ref={content} aria-hidden={blocked || undefined}>
        {ready && children}
      </div>
      {blocked && (
        <InterfaceLoadingScreen
          language={state.language}
          error={state.error}
          screenRef={screen}
          onRetry={() => changeLanguage(state.language)}
        />
      )}
    </InterfacePreparationContext.Provider>
  )
}
