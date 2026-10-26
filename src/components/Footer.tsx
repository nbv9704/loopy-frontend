import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import headerLogo from '../assets/images/logos/header/logo-w256.png'

export interface FooterProps {
  footerContent?: Record<string, string | null>
}

const Footer: React.FC<FooterProps> = ({ footerContent = {} }) => {
  const { t } = useTranslation()
  const text = (key: string, fallback: string) =>
    footerContent[key] || t(key, { defaultValue: fallback })
  // Only expose destinations implemented by AppRouter; no placeholder company/legal links.
  const columns = [
    {
      title: text('footer.learning', 'Học cùng Loopy'),
      items: [
        { to: '/languages', label: text('footer.languages', 'Ngôn ngữ lập trình') },
        { to: '/onboarding', label: text('footer.paths', 'Chọn lộ trình') },
        { to: '/practice', label: text('footer.practice', 'Luyện tập') },
      ],
    },
    {
      title: text('footer.resources', 'Tài nguyên'),
      items: [
        { to: '/docs', label: text('footer.docs', 'Tài liệu') },
        { to: '/playground', label: text('footer.playground', 'Chạy thử code') },
      ],
    },
  ]
  return (
    <footer className="loopy-surface relative mt-auto border-t loopy-border">
      <div className="mx-auto max-w-[1600px] px-6 py-12 md:px-12">
        <div className="mb-10 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link to="/" aria-label={text('nav.home', 'Trang chủ')}>
              <img src={headerLogo} alt="Loopy" className="mb-4 h-10" />
            </Link>
            <p className="loopy-body max-w-md text-sm leading-relaxed">
              {text('footer.description', 'Học lập trình theo lộ trình và thực hành từng bước.')}
            </p>
          </div>
          {columns.map(column => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="loopy-heading mb-4 text-sm font-bold uppercase tracking-wider">
                {column.title}
              </h2>
              <ul className="space-y-3">
                {column.items.map(item => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="loopy-muted text-sm transition-colors hover:text-brand-teal"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="loopy-muted border-t loopy-border pt-6 text-xs">
          © {new Date().getFullYear()} Loopy.{' '}
          {text('footer.allRightsReserved', 'All rights reserved.')}
        </p>
      </div>
    </footer>
  )
}
export default Footer
