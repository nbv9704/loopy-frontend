/**
 * GradingDepthDropdown — Split button with portal-based dropdown
 * for selecting AI grading depth (quick / careful / thorough).
 */

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiSend, FiZap, FiEye, FiSearch, FiChevronDown } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import type { GradingDepth } from '../../types/grading.types'

interface GradingDepthDropdownProps {
  isGrading: boolean
  onGrade: (depth: GradingDepth) => void
  /** Custom label for the main button */
  label?: string
  /** Open menu upward instead of downward */
  dropUp?: boolean
}

const GradingDepthDropdown: React.FC<GradingDepthDropdownProps> = ({
  isGrading,
  onGrade,
  label,
  dropUp = false,
}) => {
  const { t } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const resolvedLabel = label || t('gradingUI.grade')

  const GRADING_MODES: { key: GradingDepth; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'quick', label: t('gradingUI.quick'), desc: '~3-5s', icon: <FiZap className="w-3.5 h-3.5" /> },
    {
      key: 'careful',
      label: t('gradingUI.careful'),
      desc: '~8-12s',
      icon: <FiEye className="w-3.5 h-3.5" />,
    },
    {
      key: 'thorough',
      label: t('gradingUI.thorough'),
      desc: '~15-25s',
      icon: <FiSearch className="w-3.5 h-3.5" />,
    },
  ]

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showMenu])

  const handleSelect = (depth: GradingDepth) => {
    setShowMenu(false)
    onGrade(depth)
  }

  const baseStyle = isGrading
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer hover:bg-brand-cyan/30'

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex">
        {/* Main button — default quick grade */}
        <button
          onClick={() => handleSelect('quick')}
          disabled={isGrading}
          className={`rounded-l-xl px-5 py-2.5 bg-brand-cyan/20 border border-brand-cyan/50 border-r-0 text-brand-cyan text-sm font-bold flex items-center gap-2 transition-all duration-300 shadow-lg shadow-brand-cyan/20 ${baseStyle}`}
        >
          {isGrading ? (
            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          ) : (
            <FiSend className="w-4 h-4" />
          )}
          {isGrading ? t('gradingUI.grading') : resolvedLabel}
        </button>

        {/* Dropdown trigger */}
        <button
          ref={triggerRef}
          onClick={() => !isGrading && setShowMenu(!showMenu)}
          disabled={isGrading}
          className={`rounded-r-xl px-2 py-2.5 bg-brand-cyan/20 border border-brand-cyan/50 text-brand-cyan text-sm transition-all duration-300 ${baseStyle}`}
        >
          <FiChevronDown
            className={`w-3.5 h-3.5 transition-transform ${dropUp ? (showMenu ? '' : 'rotate-180') : showMenu ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Portal menu (dropdown or dropup) */}
      {showMenu &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              ...(dropUp
                ? {
                    bottom:
                      window.innerHeight -
                      (triggerRef.current?.getBoundingClientRect().top ?? 0) +
                      8,
                  }
                : { top: (triggerRef.current?.getBoundingClientRect().bottom ?? 0) + 8 }),
              right: window.innerWidth - (triggerRef.current?.getBoundingClientRect().right ?? 0),
              zIndex: 9999,
            }}
            className="w-52 bg-bg-elevated border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-fade-in"
            ref={menuRef}
          >
            {GRADING_MODES.map(mode => (
              <button
                key={mode.key}
                onClick={() => handleSelect(mode.key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span className="text-brand-cyan">{mode.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{mode.label}</p>
                  <p className="text-xs text-gray-500">{mode.desc}</p>
                </div>
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}

export default GradingDepthDropdown
