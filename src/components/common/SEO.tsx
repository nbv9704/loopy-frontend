import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  noIndex?: boolean
}

const SEO: React.FC<SEOProps> = ({
  title = 'Loopy - Interactive Multi-Language Coding Playground',
  description = 'Learn programming step by step, practice with real code, and follow a guided learning path.',
  keywords = 'learn programming, coding playground, JavaScript, Python, C++, code editor, guided learning',
  image = 'https://loopy.dev/og-image.png',
  url = 'https://loopy.dev',
  type = 'website',
  author = 'Loopy Team',
  publishedTime,
  modifiedTime,
  noIndex = false,
}) => {
  const { i18n } = useTranslation()
  const fullTitle = title.includes('Loopy') ? title : `${title} | Loopy`
  const canonicalUrl = url.startsWith('http') ? url : `https://loopy.dev${url}`

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={i18n.language === 'vi' ? 'vi_VN' : 'en_US'} />
      <meta property="og:site_name" content="Loopy" />

      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="language" content="Vietnamese" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  )
}

export default SEO
