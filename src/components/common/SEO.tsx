import { Helmet } from 'react-helmet-async'

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
}

const SEO: React.FC<SEOProps> = ({
  title = 'Loopy - Interactive Multi-Language Coding Playground',
  description = 'Nền tảng học lập trình tương tác với thực thi code trực tiếp trên trình duyệt. Hỗ trợ JavaScript, Python, C++ và nhiều ngôn ngữ khác.',
  keywords = 'học lập trình, coding playground, JavaScript, Python, C++, code editor, online IDE, học code online, lập trình Việt Nam',
  image = 'https://loopy.dev/og-image.png',
  url = 'https://loopy.dev',
  type = 'website',
  author = 'Loopy Team',
  publishedTime,
  modifiedTime,
}) => {
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
      <meta property="og:locale" content="vi_VN" />
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
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Vietnamese" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  )
}

export default SEO
