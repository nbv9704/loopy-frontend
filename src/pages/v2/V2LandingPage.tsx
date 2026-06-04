import { FiBookOpen, FiCheckCircle, FiCode, FiCompass, FiLock, FiPlay, FiTerminal, FiZap } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'
import { useContentPreloader } from '../../hooks/useContentPreloader'
import { LoadingScreen } from '../../components/v2/LoadingScreen'

const languages = ['Python', 'JavaScript', 'C++', 'SQL', 'HTML', 'CSS', 'Git', 'Terminal']

// Learning steps will be populated from CMS in component

// Journey nodes will be populated from CMS in component

function ProductMock({ badge, status, title, desc, item1, item2, item3, item4 }: any) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-300/60">
      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 text-white">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-teal">
            <FiCompass /> {badge || 'Lesson 03'}
          </div>
          <div className="rounded-full bg-brand-teal px-3 py-1 text-xs font-black text-slate-950">{status || 'Đang học'}</div>
        </div>
        <div className="grid min-h-[420px] md:grid-cols-[0.8fr,1.2fr]">
          <div className="border-b border-white/10 bg-white/[0.04] p-5 md:border-b-0 md:border-r">
            <div className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Mentor</div>
            <h3 className="text-2xl font-black">{title || 'Thay đổi một dòng, thấy output ngay'}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {desc || 'Loopy không bắt bạn đọc hết lý thuyết trước. Bạn quan sát, sửa code nhỏ, chạy thử, rồi kiểm tra bằng test rõ ràng.'}
            </p>
            <div className="mt-5 grid gap-2">
              {[item1 || 'Quan sát code mẫu', item2 || 'Sửa yêu cầu nhỏ', item3 || 'Kiểm tra bằng rule', item4 || 'Debug lỗi thật'].map((item, index) => (
                <div key={item} className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm ${index === 1 ? 'border-brand-teal bg-brand-teal/10 text-brand-teal' : 'border-white/10 bg-white/[0.03] text-slate-300'}`}>
                  <FiCheckCircle /> {item}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="font-mono text-xs text-slate-400">main.js</div>
              <button className="rounded-xl bg-brand-teal px-3 py-2 text-xs font-black text-slate-950 shadow-[0_3px_0_#0b889c]">Kiểm tra</button>
            </div>
            <div className="flex-1 bg-[#020617] p-5 font-mono text-sm leading-7">
              <div><span className="text-purple-300">const</span> name <span className="text-slate-500">=</span> <span className="text-emerald-300">"Loopy"</span></div>
              <div><span className="text-sky-300">console</span>.<span className="text-yellow-200">log</span>(<span className="text-emerald-300">`Xin chào ${'${name}'}`</span>)</div>
              <div className="mt-6 rounded-2xl border border-brand-teal/30 bg-brand-teal/10 p-4 font-sans text-sm text-brand-teal">
                Output: Xin chào Loopy
              </div>
            </div>
            <div className="border-t border-white/10 bg-black/30 p-4 font-mono text-xs text-slate-300">
              <div className="text-brand-teal">✓ Test #1: Có in ra lời chào</div>
              <div className="mt-1 text-brand-teal">✓ Test #2: Dùng biến name</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const V2LandingPage: React.FC = () => {
  const { i18n } = useTranslation()

  // Define all content keys needed for this page (including header)
  const contentKeys = [
    // Header content
    'nav.learn',
    'nav.playground',
    'nav.practice',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    // Landing page content
    'landing.hero.title',
    'landing.hero.subtitle',
    'landing.cta.primary',
    'landing.cta.secondary',
    'landing.learn.badge',
    'landing.learn.title',
    'landing.step1.title',
    'landing.step1.desc',
    'landing.step2.title',
    'landing.step2.desc',
    'landing.step3.title',
    'landing.step3.desc',
    'landing.journey.badge',
    'landing.journey.title',
    'landing.journey.desc',
    'landing.journey.node1',
    'landing.journey.node2',
    'landing.journey.node3',
    'landing.journey.node4',
    'landing.journey.node5',
    'landing.pmock.badge',
    'landing.pmock.status',
    'landing.pmock.title',
    'landing.pmock.desc',
    'landing.pmock.item1',
    'landing.pmock.item2',
    'landing.pmock.item3',
    'landing.pmock.item4',
    'landing.faq.badge',
    'landing.faq.title',
    'landing.faq1.q',
    'landing.faq1.a',
    'landing.faq2.q',
    'landing.faq2.a',
    'landing.faq3.q',
    'landing.faq3.a',
    'landing.bottom.title',
    'landing.bottom.desc',
    'landing.bottom.btn',
    // Footer content
    'footer.aboutLoopy',
    'footer.about',
    'footer.team',
    'footer.contact',
    'footer.resources',
    'footer.docs',
    'footer.blog',
    'footer.faq',
    'footer.description',
    'footer.allRightsReserved',
    'footer.privacy',
    'footer.terms',
  ]

  // Preload all content at once
  const { content, loading } = useContentPreloader(contentKeys, i18n.language)

  // Show loading screen while content is being fetched
  if (loading) {
    return <LoadingScreen message="Loading landing page..." />
  }

  // Extract header content
  const headerContent = {
    'nav.learn': content['nav.learn'],
    'nav.playground': content['nav.playground'],
    'nav.practice': content['nav.practice'],
    'nav.docs': content['nav.docs'],
    'nav.settings': content['nav.settings'],
    'nav.logout': content['nav.logout'],
  }

  // Extract footer content
  const footerContent = {
    'footer.aboutLoopy': content['footer.aboutLoopy'],
    'footer.about': content['footer.about'],
    'footer.team': content['footer.team'],
    'footer.contact': content['footer.contact'],
    'footer.resources': content['footer.resources'],
    'footer.docs': content['footer.docs'],
    'footer.blog': content['footer.blog'],
    'footer.faq': content['footer.faq'],
    'footer.description': content['footer.description'],
    'footer.allRightsReserved': content['footer.allRightsReserved'],
    'footer.privacy': content['footer.privacy'],
    'footer.terms': content['footer.terms'],
  }

  // Extract content values with fallbacks
  const heroTitle = content['landing.hero.title'] || 'Học code bằng từng bước nhỏ, không bị ném vào IDE một mình.'
  const heroSubtitle = content['landing.hero.subtitle'] || 'Loopy dẫn bạn qua một flow rõ ràng: quan sát code mẫu, sửa một dòng, chạy thử output, kiểm tra bằng test case, rồi debug lỗi nhỏ như khi lập trình thật.'
  const ctaPrimary = content['landing.cta.primary'] || 'Thử bài đầu tiên'
  const ctaSecondary = content['landing.cta.secondary'] || 'Xem lộ trình'
  const learnBadge = content['landing.learn.badge'] || 'Learn by doing'
  const learnTitle = content['landing.learn.title'] || 'Mỗi bài học có một việc rõ ràng.'
  const step1Title = content['landing.step1.title'] || 'Quan sát'
  const step1Desc = content['landing.step1.desc'] || 'Đọc một ví dụ ngắn, chạy code mẫu và hiểu output trước khi phải tự viết.'
  const step2Title = content['landing.step2.title'] || 'Thay đổi'
  const step2Desc = content['landing.step2.desc'] || 'Sửa một phần nhỏ trong editor. Loopy kiểm tra đúng yêu cầu bằng rule/test case.'
  const step3Title = content['landing.step3.title'] || 'Sửa lỗi'
  const step3Desc = content['landing.step3.desc'] || 'Gặp lỗi nhỏ có chủ đích, đọc terminal và debug từng bước như khi code thật.'
  const journeyBadge = content['landing.journey.badge'] || 'Journey map'
  const journeyTitle = content['landing.journey.title'] || 'Biết mình đang ở đâu, bài nào mở tiếp theo.'
  const journeyDesc = content['landing.journey.desc'] || 'V2 ưu tiên journey rõ hơn catalog: done, active, locked được tách bạch để người mới không phải tự đoán bước kế tiếp.'
  const node1 = content['landing.journey.node1'] || 'Hello code'
  const node2 = content['landing.journey.node2'] || 'Biến'
  const node3 = content['landing.journey.node3'] || 'In output'
  const node4 = content['landing.journey.node4'] || 'Điều kiện'
  const node5 = content['landing.journey.node5'] || 'Vòng lặp'
  const pmockBadge = content['landing.pmock.badge'] || 'Lesson 03'
  const pmockStatus = content['landing.pmock.status'] || 'Đang học'
  const pmockTitle = content['landing.pmock.title'] || 'Thay đổi một dòng, thấy output ngay'
  const pmockDesc = content['landing.pmock.desc'] || 'Loopy không bắt bạn đọc hết lý thuyết trước. Bạn quan sát, sửa code nhỏ, chạy thử, rồi kiểm tra bằng test rõ ràng.'
  const pmockItem1 = content['landing.pmock.item1'] || 'Quan sát code mẫu'
  const pmockItem2 = content['landing.pmock.item2'] || 'Sửa yêu cầu nhỏ'
  const pmockItem3 = content['landing.pmock.item3'] || 'Kiểm tra bằng rule'
  const pmockItem4 = content['landing.pmock.item4'] || 'Debug lỗi thật'
  const faqBadge = content['landing.faq.badge'] || 'FAQ'
  const faqTitle = content['landing.faq.title'] || 'V2 đang test điều gì?'
  const faq1Q = content['landing.faq1.q'] || 'Route này có thay landing hiện tại không?'
  const faq1A = content['landing.faq1.a'] || 'Không. Đây là sandbox riêng để test visual trước khi thay route thật.'
  const faq2Q = content['landing.faq2.q'] || 'Có copy Coddy không?'
  const faq2A = content['landing.faq2.a'] || 'Không. Capture chỉ dùng làm reference về cấu trúc. Copy, asset và claim được viết lại cho Loopy.'
  const faq3Q = content['landing.faq3.q'] || 'Ưu tiên tiếp theo là gì?'
  const faq3A = content['landing.faq3.a'] || 'Sau landing, nên dựng v2 library/journey map rồi mới polish Learn.'
  const bottomTitle = content['landing.bottom.title'] || 'Bắt đầu bằng một bài nhỏ.'
  const bottomDesc = content['landing.bottom.desc'] || 'Nếu hướng v2 này ổn, ta sẽ tiếp tục dựng `/v2/library` và `/v2/learn` trước khi thay UI thật.'
  const bottomBtn = content['landing.bottom.btn'] || 'Tìm lộ trình phù hợp'

  return (
    <V2PublicShell headerContent={headerContent} footerContent={footerContent}>
      <main>
        <section className="relative overflow-hidden px-4 py-16 md:px-6 md:py-24">
          <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr,1.1fr]">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                Guided coding journey
              </div>
              <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                {heroTitle}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {heroSubtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <V2PressedButton to="/onboarding"><FiPlay /> {ctaPrimary}</V2PressedButton>
                <V2PressedButton to="/languages" variant="secondary">{ctaSecondary}</V2PressedButton>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {languages.map(language => (
                  <span key={language} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">{language}</span>
                ))}
              </div>
            </div>
            <ProductMock badge={pmockBadge} status={pmockStatus} title={pmockTitle} desc={pmockDesc} item1={pmockItem1} item2={pmockItem2} item3={pmockItem3} item4={pmockItem4} />
          </div>
        </section>

        <section id="learn" className="bg-white px-4 py-16 md:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-ocean">{learnBadge}</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{learnTitle}</h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { title: step1Title, description: step1Desc, icon: FiBookOpen },
                { title: step2Title, description: step2Desc, icon: FiCode },
                { title: step3Title, description: step3Desc, icon: FiTerminal },
              ].map(step => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="rounded-[2rem] border border-slate-200 bg-[#f8fafc] p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-teal hover:shadow-xl hover:shadow-slate-200">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-brand-teal shadow-[0_4px_0_#54d9c4]"><Icon /></div>
                    <h3 className="text-2xl font-black">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="journey" className="px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr,1.2fr]">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-ocean">{journeyBadge}</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{journeyTitle}</h2>
              <p className="mt-5 text-base leading-7 text-slate-600">{journeyDesc}</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="grid gap-4 sm:grid-cols-5">
                {[
                  { title: node1, state: 'done' },
                  { title: node2, state: 'done' },
                  { title: node3, state: 'active' },
                  { title: node4, state: 'locked' },
                  { title: node5, state: 'locked' },
                ].map((node, index) => (
                  <div key={node.title} className="relative flex flex-col items-center gap-3 text-center">
                    {index < 4 && <div className="absolute left-1/2 top-8 hidden h-1 w-full bg-slate-200 sm:block" />}
                    <div className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border-4 text-xl font-black shadow-[0_5px_0_rgba(15,23,42,0.18)] ${node.state === 'done' ? 'border-brand-teal bg-brand-teal text-slate-950' : node.state === 'active' ? 'border-slate-950 bg-white text-slate-950' : 'border-slate-200 bg-slate-100 text-slate-400'}`}>
                      {node.state === 'locked' ? <FiLock /> : index + 1}
                    </div>
                    <div className="text-sm font-black text-slate-700">{node.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-slate-950 px-4 py-16 text-white md:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.8fr,1.2fr]">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-teal">{faqBadge}</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight">{faqTitle}</h2>
            </div>
            <div className="grid gap-3">
              {[
                [faq1Q, faq1A],
                [faq2Q, faq2A],
                [faq3Q, faq3A],
              ].map(([question, answer]) => (
                <div key={question} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="font-black">{question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70 md:p-12">
            <FiZap className="mb-4 h-10 w-10 text-brand-ocean" />
            <h2 className="text-4xl font-black tracking-tight">{bottomTitle}</h2>
            <p className="mt-4 max-w-2xl text-slate-600">{bottomDesc}</p>
            <div className="mt-7">
              <V2PressedButton to="/onboarding">{bottomBtn}</V2PressedButton>
            </div>
          </div>
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2LandingPage
