import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Code2, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import headerLogo from '../../assets/images/logos/header/logo-w256.png'

const Footer: React.FC = () => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  const FOOTER_COLUMNS = [
    {
      id: 'about',
      title: t('footer.aboutLoopy'),
      items: [
        { label: t('footer.about'), path: '/about' },
        { label: t('footer.team'), path: '/team' },
        { label: t('footer.contact'), path: '/contact' },
      ],
    },
    {
      id: 'resources',
      title: t('footer.resources'),
      items: [
        { label: t('footer.docs'), path: '/docs' },
        { label: t('footer.blog'), path: '/blog' },
        { label: t('footer.faq'), path: '/faq' },
      ],
    },
  ]

  return (
    <footer className="relative bg-[#0B0F19] border-t border-white/5 mt-auto">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={headerLogo} alt="Loopy" className="h-10" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
              {t('footer.description')}
            </p>

            {/* Social */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-brand-teal transition-colors"
                aria-label="GitHub"
              >
                <Code2 className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-brand-cyan transition-colors"
                aria-label="Blog"
              >
                <BookOpen className="w-5 h-5" />
              </a>
              <a
                href="mailto:contact@loopy.dev"
                className="text-slate-400 hover:text-brand-teal transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Footer Columns */}
          {FOOTER_COLUMNS.map(column => (
            <div key={column.id}>
              <h3 className="text-white font-semibold text-sm mb-4">{column.title}</h3>
              <ul className="space-y-3">
                {column.items.map((item, index) => (
                  <li key={index}>
                    <Link
                      to={item.path}
                      className="text-slate-400 text-sm hover:text-brand-teal transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            {t('footer.copyright', { year: currentYear })}
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-slate-500 hover:text-brand-teal transition-colors">
              {t('footer.terms')}
            </a>
            <a href="#" className="text-slate-500 hover:text-brand-teal transition-colors">
              {t('footer.privacy')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
