/**
 * Static Content Constants
 *
 * All static UI text, navigation, and content that was previously managed via CMS.
 * This approach is faster, simpler, and eliminates unnecessary database queries.
 *
 * To update content: Edit this file directly and redeploy.
 */

// ============================================================================
// LANDING PAGE
// ============================================================================

export const LANDING = {
  hero: {
    title: 'Học lập trình từ con số 0',
    subtitle: 'Vượt qua 20 giờ đầu tiên học lập trình với lộ trình cá nhân hóa, thực hành thật và hỗ trợ bởi AI Mentor.',
    cta: {
      primary: { label: 'Bắt đầu từ số 0', href: '/learn' },
      secondary: { label: 'Thử bài đầu tiên', href: '#demo' },
    },
  },

  features: [
    {
      id: 'practice-first',
      icon: 'code',
      title: 'Thực hành là trên hết',
      description: 'Không chỉ xem video, bạn sẽ viết code và thấy kết quả ngay từ phút đầu tiên.',
      color: 'blue',
    },
    {
      id: 'ai-mentor',
      icon: 'cpu',
      title: 'Mentor AI 24/7',
      description: 'Hệ thống gợi ý thông minh giúp bạn vượt qua lỗi sai mà không cần chờ đợi.',
      color: 'cyan',
    },
    {
      id: 'personalized',
      icon: 'trending-up',
      title: 'Lộ trình cá nhân hóa',
      description: 'Nội dung bài học điều chỉnh theo mục tiêu và trình độ của riêng bạn.',
      color: 'purple',
    },
    {
      id: 'tiny-lessons',
      icon: 'zap',
      title: 'Bài học siêu nhỏ',
      description: 'Chỉ mất 2-5 phút cho mỗi khái niệm, phù hợp với người bận rộn.',
      color: 'yellow',
    },
    {
      id: 'real-feedback',
      icon: 'check-circle',
      title: 'Phản hồi tức thì',
      description: 'Biết ngay code của bạn đúng hay sai và cách để sửa nó tốt hơn.',
      color: 'green',
    },
    {
      id: 'goal-oriented',
      icon: 'globe',
      title: 'Hướng tới mục tiêu',
      description: 'Chọn mục tiêu của bạn: Làm web, làm app, hay chỉ là tò mò.',
      color: 'pink',
    },
  ],

  languages: [
    {
      id: 'javascript',
      name: 'JavaScript',
      icon: 'SiJavascript',
      description: 'Phù hợp để làm Website và ứng dụng tương tác.',
      color: '#F7DF1E',
      lessonCount: 50,
    },
    {
      id: 'python',
      name: 'Python',
      icon: 'SiPython',
      description: 'Ngôn ngữ dễ học nhất, mạnh mẽ cho AI và dữ liệu.',
      color: '#3776AB',
      lessonCount: 45,
    },
    {
      id: 'cpp',
      name: 'C++',
      icon: 'SiCplusplus',
      description: 'Dành cho ai muốn hiểu sâu về cách máy tính vận hành.',
      color: '#00599C',
      lessonCount: 40,
    },
  ],

  stats: [
    { id: 'zero-to-hero', label: 'Bắt đầu từ số 0', value: '100%', icon: 'users' },
    { id: 'practice-rate', label: 'Thực hành', value: '90%', icon: 'code' },
    { id: 'aha-moment', label: 'Bài học Aha!', value: '50+', icon: 'zap' },
    { id: 'support', label: 'Hỗ trợ AI', value: '24/7', icon: 'cpu' },
  ],

  howItWorks: [
    {
      id: 'choose-goal',
      step: 1,
      title: 'Chọn mục tiêu',
      description: 'Xác định bạn muốn xây dựng gì hoặc học vì mục đích gì.',
      icon: 'globe',
    },
    {
      id: 'real-coding',
      step: 2,
      title: 'Viết code thực tế',
      description: 'Bạn sẽ bắt tay vào viết dòng code đầu tiên ngay lập tức.',
      icon: 'terminal',
    },
    {
      id: 'instant-results',
      step: 3,
      title: 'Nhận kết quả ngay',
      description: 'Thấy code chạy và nhận gợi ý sửa lỗi thông minh từ AI.',
      icon: 'check-circle',
    },
    {
      id: 'mastery',
      step: 4,
      title: 'Chinh phục cột mốc',
      description: 'Hoàn thành các thử thách và xây dựng sản phẩm của riêng bạn.',
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
