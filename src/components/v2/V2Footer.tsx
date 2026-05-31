import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Code2, BookOpen } from 'lucide-react'
import headerLogo from '../../assets/images/logos/header/logo-w256.png'

export interface V2FooterProps {
  footerContent?: {
    [key: string]: string | null
  }
}

const V2Footer: React.FC<V2FooterProps> = ({ footerContent = {} }) => {
  const currentYear = new Date().getFullYear()

  // Helper to get footer content with fallback
  const getFooterText = (key: string, fallback: string = ''): string => {
    return footerContent[key] || fallback
  }

  const FOOTER_COLUMNS = [
    {
      id: 'about',
      titleKey: 'footer.aboutLoopy',
      items: [
        { labelKey: 'footer.about', path: '/about' },
        { labelKey: 'footer.team', path: '/team' },
        { labelKey: 'footer.contact', path: '/contact' },
      ],
    },
    {
      id: 'resources',
      titleKey: 'footer.resources',
      items: [
        { labelKey: 'footer.docs', path: '/docs' },
        { labelKey: 'footer.blog', path: '/blog' },
        { labelKey: 'footer.faq', path: '/faq' },
      ],
    },
  ]

  return (
    <footer className="relative bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={headerLogo} alt="Loopy" className="h-10" />
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-md">
              {getFooterText('footer.description', 'Learn to code by building real projects.')}
            </p>

            {/* Social */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-brand-teal"
              >
                <Code2 size={20} />
              </a>
              <a
                href="mailto:hello@loopy.dev"
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-brand-teal"
              >
                <Mail size={20} />
              </a>
              <a
                href="https://blog.loopy.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-brand-teal"
              >
                <BookOpen size={20} />
              </a>
            </div>
          </div>

          {/* Footer Columns */}
          {FOOTER_COLUMNS.map(column => (
            <div key={column.id}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
                {getFooterText(column.titleKey, column.titleKey)}
              </h3>
              <ul className="space-y-3">
                {column.items.map(item => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-sm text-slate-600 hover:text-brand-teal transition-colors"
                    >
                      {getFooterText(item.labelKey, item.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 pt-8">
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © {currentYear} Loopy. {getFooterText('footer.allRightsReserved', 'All rights reserved.')}
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
                {getFooterText('footer.privacy', 'Privacy')}
              </Link>
              <Link to="/terms" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
                {getFooterText('footer.terms', 'Terms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default V2Footer
