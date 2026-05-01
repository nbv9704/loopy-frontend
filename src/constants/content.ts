/**
 * Static Content Constants
 * 
 * All static UI text, navigation, and content that was previously managed via CMS.
 * This approach is faster, simpler, and eliminates unnecessary database queries.
 * 
 * To update content: Edit this file directly and redeploy.
 * 
 * Note: Header navigation and footer are now hardcoded in their respective components.
 * This file only contains landing page and documentation content.
 */

// ============================================================================
// LANDING PAGE
// ============================================================================

export const LANDING = {
  hero: {
    title: 'Học lập trình với AI',
    subtitle: 'Nền tảng học lập trình hiện đại với AI hỗ trợ và chế độ đối kháng',
    cta: {
      primary: { label: 'Bắt đầu học', href: '/learn' },
      secondary: { label: 'Xem demo', href: '#demo' },
    },
  },

  features: [
    {
      id: 'ai-powered',
      icon: 'cpu',
      title: 'AI Grading',
      description: 'Hệ thống chấm điểm tự động bằng AI, feedback chi tiết và chính xác',
      color: 'cyan',
    },
    {
      id: 'interactive',
      icon: 'code',
      title: 'Interactive Coding',
      description: 'Viết code trực tiếp trên trình duyệt, chạy và test ngay lập tức',
      color: 'blue',
    },
    {
      id: 'pvp-mode',
      icon: 'zap',
      title: 'PvP Mode',
      description: 'Thi đấu coding 1v1, thử thách bạn bè và leo rank',
      color: 'yellow',
    },
    {
      id: 'multi-language',
      icon: 'globe',
      title: 'Multi-Language',
      description: 'Hỗ trợ nhiều ngôn ngữ lập trình: JavaScript, Python, C++, Java',
      color: 'green',
    },
    {
      id: 'progress-tracking',
      icon: 'trending-up',
      title: 'Progress Tracking',
      description: 'Theo dõi tiến độ học tập, xem thống kê và cải thiện kỹ năng',
      color: 'purple',
    },
    {
      id: 'community',
      icon: 'users',
      title: 'Community',
      description: 'Cộng đồng học viên năng động, chia sẻ kiến thức và kinh nghiệm',
      color: 'pink',
    },
  ],

  languages: [
    {
      id: 'javascript',
      name: 'JavaScript',
      icon: 'SiJavascript',
      description: 'Ngôn ngữ phổ biến nhất cho web development',
      color: '#F7DF1E',
      lessonCount: 50,
    },
    {
      id: 'python',
      name: 'Python',
      icon: 'SiPython',
      description: 'Ngôn ngữ dễ học, mạnh mẽ cho AI và Data Science',
      color: '#3776AB',
      lessonCount: 45,
    },
    {
      id: 'cpp',
      name: 'C++',
      icon: 'SiCplusplus',
      description: 'Ngôn ngữ hiệu suất cao cho system programming',
      color: '#00599C',
      lessonCount: 40,
    },
  ],

  stats: [
    { id: 'users', label: 'Học viên', value: '10,000+', icon: 'users' },
    { id: 'lessons', label: 'Bài học', value: '500+', icon: 'book' },
    { id: 'submissions', label: 'Bài nộp', value: '50,000+', icon: 'code' },
    { id: 'pvp-matches', label: 'Trận PvP', value: '5,000+', icon: 'zap' },
  ],

  howItWorks: [
    {
      id: 'choose-language',
      step: 1,
      title: 'Chọn ngôn ngữ',
      description: 'Chọn ngôn ngữ lập trình bạn muốn học',
      icon: 'globe',
    },
    {
      id: 'learn-lessons',
      step: 2,
      title: 'Học bài học',
      description: 'Làm theo hướng dẫn, viết code và submit bài tập',
      icon: 'book',
    },
    {
      id: 'get-feedback',
      step: 3,
      title: 'Nhận feedback',
      description: 'AI chấm điểm và đưa ra feedback chi tiết',
      icon: 'check-circle',
    },
    {
      id: 'compete',
      step: 4,
      title: 'Thi đấu',
      description: 'Thử sức với chế độ PvP, leo rank và nhận thưởng',
      icon: 'trophy',
    },
  ],
} as const

// ============================================================================
// DOCUMENTATION
// ============================================================================

export const DOCUMENTATION = {
  technologies: [
    {
      id: 'javascript',
      name: 'JavaScript',
      icon: 'SiJavascript',
      description: 'Modern JavaScript (ES6+)',
      links: [
        { title: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
        { title: 'JavaScript.info', url: 'https://javascript.info/' },
      ],
    },
    {
      id: 'python',
      name: 'Python',
      icon: 'SiPython',
      description: 'Python 3.x',
      links: [
        { title: 'Python.org', url: 'https://docs.python.org/3/' },
        { title: 'Real Python', url: 'https://realpython.com/' },
      ],
    },
    {
      id: 'cpp',
      name: 'C++',
      icon: 'SiCplusplus',
      description: 'Modern C++ (C++17/20)',
      links: [
        { title: 'cppreference.com', url: 'https://en.cppreference.com/' },
        { title: 'Learn C++', url: 'https://www.learncpp.com/' },
      ],
    },
  ],
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Feature = (typeof LANDING.features)[number]
export type Language = (typeof LANDING.languages)[number]
export type Stat = (typeof LANDING.stats)[number]
export type HowItWorksStep = (typeof LANDING.howItWorks)[number]
export type Technology = (typeof DOCUMENTATION.technologies)[number]
