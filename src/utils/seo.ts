/**
 * SEO Utilities
 * Helper functions for generating SEO metadata
 */

export interface PageMetadata {
  title: string
  description: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
}

/**
 * Default metadata for the application
 */
export const defaultMetadata: PageMetadata = {
  title: 'Loopy - Interactive Multi-Language Coding Playground',
  description:
    'Nền tảng học lập trình tương tác với thực thi code trực tiếp trên trình duyệt. Hỗ trợ JavaScript, Python, C++ và nhiều ngôn ngữ khác.',
  keywords:
    'học lập trình, coding playground, JavaScript, Python, C++, code editor, online IDE, học code online, lập trình Việt Nam',
  image: 'https://loopy.dev/og-image.png',
  url: 'https://loopy.dev',
  type: 'website',
}

/**
 * Page-specific metadata configurations
 */
export const pageMetadata = {
  home: {
    title: 'Loopy - Học lập trình tương tác với code playground',
    description:
      'Nền tảng học lập trình tương tác với thực thi code trực tiếp trên trình duyệt. Hỗ trợ JavaScript, Python, C++ và nhiều ngôn ngữ khác.',
    keywords: 'học lập trình, coding playground, JavaScript, Python, C++, code editor, online IDE',
    url: '/',
  },

  learn: {
    title: 'Học lập trình - Bài học có cấu trúc',
    description:
      'Học lập trình qua các bài học có cấu trúc với code editor tích hợp và terminal thực thi ngay lập tức.',
    keywords:
      'học lập trình, bài học lập trình, JavaScript tutorial, Python tutorial, C++ tutorial',
    url: '/learn',
  },

  playground: {
    title: 'Code Playground - Thử nghiệm code trực tuyến',
    description:
      'Code playground với hỗ trợ nhiều ngôn ngữ lập trình. Viết và chạy code trực tiếp trên trình duyệt.',
    keywords:
      'code playground, online IDE, JavaScript playground, Python playground, C++ playground',
    url: '/playground',
  },

  docs: {
    title: 'Tài liệu - Documentation & Resources',
    description: 'Tài liệu hướng dẫn, API reference và resources cho các ngôn ngữ lập trình.',
    keywords: 'tài liệu lập trình, programming documentation, API reference, coding resources',
    url: '/docs',
  },

  auth: {
    title: 'Đăng nhập / Đăng ký',
    description:
      'Đăng nhập hoặc tạo tài khoản để lưu tiến độ học tập và truy cập đầy đủ tính năng.',
    keywords: 'đăng nhập, đăng ký, tạo tài khoản',
    url: '/auth',
  },

  settings: {
    title: 'Cài đặt - Tùy chỉnh trải nghiệm',
    description: 'Quản lý thông tin cá nhân, theo dõi tiến độ học tập và tùy chỉnh preferences.',
    keywords: 'cài đặt, settings, profile, preferences',
    url: '/settings',
  },

  admin: {
    title: 'Admin Dashboard - Quản lý nội dung',
    description: 'Quản lý nội dung, bài học, tài liệu và cấu hình hệ thống.',
    keywords: 'admin, dashboard, content management',
    url: '/admin',
  },
  challenges: {
    title: 'Chế độ Thử thách - Rèn luyện code thời gian thực',
    description: 'Tham gia các thử thách lập trình 1v1 thời gian thực để rèn luyện kỹ năng và phản xạ code.',
    keywords: 'thử thách lập trình, coding challenges, 1v1 coding, thi đấu lập trình',
    url: '/pvp',
  },
}

/**
 * Generate metadata for a specific language learning page
 */
export const getLanguageMetadata = (language: string): PageMetadata => {
  const languageNames: Record<string, string> = {
    javascript: 'JavaScript',
    python: 'Python',
    cpp: 'C++',
    java: 'Java',
    rust: 'Rust',
    go: 'Go',
  }

  const langName = languageNames[language] || language

  return {
    title: `Học ${langName} - Bài học tương tác`,
    description: `Học ${langName} qua các bài học có cấu trúc với code editor và terminal thực thi ngay lập tức. Từ cơ bản đến nâng cao.`,
    keywords: `học ${langName}, ${langName} tutorial, ${langName} course, ${langName} playground`,
    url: `/learn/${language}`,
  }
}

/**
 * Generate metadata for a specific lesson
 */
export const getLessonMetadata = (
  language: string,
  lessonTitle: string,
  lessonDescription?: string
): PageMetadata => {
  const languageNames: Record<string, string> = {
    javascript: 'JavaScript',
    python: 'Python',
    cpp: 'C++',
    java: 'Java',
    rust: 'Rust',
    go: 'Go',
  }

  const langName = languageNames[language] || language

  return {
    title: `${lessonTitle} - ${langName}`,
    description:
      lessonDescription ||
      `Học ${lessonTitle} trong ${langName} với code editor tương tác và ví dụ thực tế.`,
    keywords: `${langName}, ${lessonTitle}, ${langName} tutorial, coding lesson`,
    type: 'article',
  }
}

/**
 * Generate structured data for SEO
 */
export const generateStructuredData = (type: 'WebSite' | 'Course' | 'Article', data: any) => {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
  }

  switch (type) {
    case 'WebSite':
      return {
        ...baseData,
        name: 'Loopy',
        url: 'https://loopy.dev',
        description: 'Interactive multi-language coding playground',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://loopy.dev/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }

    case 'Course':
      return {
        ...baseData,
        name: data.name,
        description: data.description,
        provider: {
          '@type': 'Organization',
          name: 'Loopy',
          sameAs: 'https://loopy.dev',
        },
      }

    case 'Article':
      return {
        ...baseData,
        headline: data.title,
        description: data.description,
        author: {
          '@type': 'Organization',
          name: 'Loopy',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Loopy',
          logo: {
            '@type': 'ImageObject',
            url: 'https://loopy.dev/logo.png',
          },
        },
        datePublished: data.publishedTime,
        dateModified: data.modifiedTime,
      }

    default:
      return baseData
  }
}
