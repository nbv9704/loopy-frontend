import { useTranslation } from 'react-i18next'
import { FiBookOpen, FiCode, FiCompass, FiFileText, FiHash, FiPlay, FiSearch, FiTerminal } from 'react-icons/fi'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'
import { useContentPreloader } from '../../hooks/useContentPreloader'
import { LoadingScreen } from '../../components/v2/LoadingScreen'

function CodeBlock({ codeOutput }: { codeOutput: string | null }) {
  const lines = ['const name = "Loopy"', 'console.log(`Xin chào ${name}`)']

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400"><FiCode /> main.js</div>
        <div className="rounded-full bg-brand-teal/15 px-3 py-1 text-xs font-black text-brand-teal">example</div>
      </div>
      <div className="bg-[#020617] p-5 font-mono text-sm leading-8">
        {lines.map((line, index) => (
          <div key={line}><span className="select-none pr-4 text-slate-600">{index + 1}</span>{line}</div>
        ))}
      </div>
      <div className="border-t border-white/10 bg-black/30 p-4 font-mono text-sm text-slate-300">
        Output: {codeOutput || 'Xin chào Loopy'}
      </div>
    </div>
  )
}

const V2DocsPage: React.FC = () => {
  const { i18n } = useTranslation()

  // Define all content keys needed for this page (including header)
  const contentKeys = [
    // Header content
    'nav.learn',
    'nav.playground',
    'nav.pvp',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    // Docs page content
    'docs.code.output',
    'docs.title',
    'docs.subtitle',
    'docs.sandbox.badge',
    'docs.search.quick',
    'docs.search.hint',
    'docs.topic.title',
    'docs.group1.title',
    'docs.group1.items',
    'docs.group2.title',
    'docs.group2.items',
    'docs.group3.title',
    'docs.group3.items',
    'docs.ref.badge',
    'docs.ref.title',
    'docs.ref.desc',
    'docs.play.badge',
    'docs.play.desc',
    'docs.check.badge',
    'docs.check.desc',
    'docs.tips.title',
    'docs.tips.desc',
    'docs.terminal.badge',
    'docs.terminal.desc',
    'docs.toc.title',
    'docs.toc.items',
    'docs.next.badge',
    'docs.next.title',
    'docs.next.desc',
    'docs.next.btn1',
    'docs.next.btn2',
    'docs.bottom.title',
    'docs.bottom.desc',
    'docs.bottom.btn1',
    'docs.bottom.btn2',
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
    return <LoadingScreen message="Loading docs page..." />
  }

  // Extract header content
  const headerContent = {
    'nav.learn': content['nav.learn'],
    'nav.playground': content['nav.playground'],
    'nav.pvp': content['nav.pvp'],
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
  const codeOutput = content['docs.code.output'] || 'Xin chào Loopy'
  const docsTitle = content['docs.title'] || 'Docs là kệ tham khảo, không phải lộ trình chính.'
  const docsSubtitle = content['docs.subtitle'] || 'Người mới cần docs để tra cứu khi bị kẹt, nhưng vẫn nên quay lại Journey Map để học có thứ tự và lưu progress đúng cách.'
  const sandboxBadge = content['docs.sandbox.badge'] || 'Docs v2 sandbox'
  const searchQuick = content['docs.search.quick'] || 'Tìm nhanh'
  const searchHint = content['docs.search.hint'] || 'Thử tìm: `console.log`, `input`, `đọc error`'
  const topicTitle = content['docs.topic.title'] || 'Chủ đề'
  const group1Title = content['docs.group1.title'] || 'JavaScript cơ bản'
  const group1Items = content['docs.group1.items'] || 'Console log|Biến|String template|Function|Điều kiện'
  const group2Title = content['docs.group2.title'] || 'Python cơ bản'
  const group2Items = content['docs.group2.items'] || 'print()|input()|Biến|f-string|Lỗi thường gặp'
  const group3Title = content['docs.group3.title'] || 'Khi bị kẹt'
  const group3Items = content['docs.group3.items'] || 'Đọc error|So sánh output|Dùng Playground'
  const refBadge = content['docs.ref.badge'] || 'JavaScript reference'
  const refTitle = content['docs.ref.title'] || 'console.log dùng để xem output nhanh.'
  const refDesc = content['docs.ref.desc'] || 'Khi mới học, `console.log` là cách đơn giản nhất để kiểm tra một giá trị đang là gì. Nó phù hợp cho Playground và bước `Chạy thử` trong lesson.'
  const playBadge = content['docs.play.badge'] || 'Khi dùng Chạy thử'
  const playDesc = content['docs.play.desc'] || 'Dùng khi bạn muốn xem output thật. Đây là execute code, không phải validation.'
  const checkBadge = content['docs.check.badge'] || 'Khi cần Kiểm tra'
  const checkDesc = content['docs.check.desc'] || 'Quay lại lesson để Loopy chấm bằng rule/test case và lưu progress sau khi hoàn thành.'
  const tipsTitle = content['docs.tips.title'] || 'Mẹo đọc output'
  const tipsDesc = content['docs.tips.desc'] || 'Nếu output không giống bạn nghĩ, hãy đổi từng biến nhỏ, chạy lại, rồi so sánh. Đừng sửa nhiều dòng cùng lúc khi mới học.'
  const terminalBadge = content['docs.terminal.badge'] || 'Từ docs sang thực hành'
  const terminalDesc = content['docs.terminal.desc'] || 'Docs giúp hiểu khái niệm. Playground giúp thử nhanh. Learn giúp hoàn thành bài có kiểm tra.'
  const tocTitle = content['docs.toc.title'] || 'Trong trang'
  const tocItems = content['docs.toc.items'] || 'Khi nào dùng docs?|Ví dụ console.log|Run khác Check|Đi tiếp ở đâu?'
  const nextBadge = content['docs.next.badge'] || 'Next step'
  const nextTitle = content['docs.next.title'] || 'Đọc xong thì code thử.'
  const nextDesc = content['docs.next.desc'] || 'Dùng Playground để thử khái niệm, hoặc vào Learn để được kiểm tra và lưu tiến độ.'
  const nextBtn1 = content['docs.next.btn1'] || 'Mở Playground'
  const nextBtn2 = content['docs.next.btn2'] || 'Vào Journey Map'
  const bottomTitle = content['docs.bottom.title'] || 'Docs hỗ trợ journey, không thay journey.'
  const bottomDesc = content['docs.bottom.desc'] || 'Khi chưa biết học tiếp gì, hãy quay lại Library thay vì lạc trong tài liệu tham khảo.'
  const bottomBtn1 = content['docs.bottom.btn1'] || 'Quay lại Journey Map'
  const bottomBtn2 = content['docs.bottom.btn2'] || 'Tìm lộ trình'

  const navGroups = [
    {
      title: group1Title,
      items: group1Items.split('|'),
    },
    {
      title: group2Title,
      items: group2Items.split('|'),
    },
    {
      title: group3Title,
      items: group3Items.split('|'),
    },
  ]

  const toc = tocItems.split('|')

  return (
    <V2PublicShell headerContent={headerContent} footerContent={footerContent}>
      <main>
        <section className="relative overflow-hidden px-4 py-14 md:px-6 md:py-20">
          <div className="absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
              <div>
                <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                  {sandboxBadge}
                </div>
                <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                  {docsTitle}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  {docsSubtitle}
                </p>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400"><FiSearch /> {searchQuick}</div>
                <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-4 text-sm font-bold text-slate-500">
                  {searchHint}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[280px,1fr,280px]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiBookOpen /> {topicTitle}</div>
                <div className="grid gap-5">
                  {navGroups.map(group => (
                    <div key={group.title}>
                      <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">{group.title}</div>
                      <div className="grid gap-1">
                        {group.items.map((item, index) => (
                          <button key={item} className={`rounded-xl px-3 py-2 text-left text-sm font-bold transition ${index === 0 ? 'bg-brand-teal/15 text-brand-ocean' : 'text-slate-600 hover:bg-slate-100'}`}>
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean"><FiFileText /> {refBadge}</div>
              <h2 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{refTitle}</h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                {refDesc}
              </p>

              <div className="my-8">
                <CodeBlock codeOutput={codeOutput} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5">
                  <div className="mb-2 flex items-center gap-2 font-black text-slate-950"><FiPlay /> {playBadge}</div>
                  <p className="text-sm leading-6 text-slate-600">{playDesc}</p>
                </div>
                <div className="rounded-2xl border border-brand-teal/30 bg-brand-teal/10 p-5">
                  <div className="mb-2 flex items-center gap-2 font-black text-brand-ocean"><FiCompass /> {checkBadge}</div>
                  <p className="text-sm leading-6 text-slate-600">{checkDesc}</p>
                </div>
              </div>

              <h3 className="mt-10 text-2xl font-black text-slate-950">{tipsTitle}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {tipsDesc}
              </p>

              <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
                <div className="flex items-center gap-2 text-sm font-black text-brand-teal"><FiTerminal /> {terminalBadge}</div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{terminalDesc}</p>
              </div>
            </article>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiHash /> {tocTitle}</div>
                <div className="grid gap-2">
                  {toc.map(item => (
                    <a key={item} href="#" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">{item}</a>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal">{nextBadge}</div>
                <h3 className="mt-3 text-2xl font-black">{nextTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{nextDesc}</p>
                <div className="mt-5 grid gap-3">
                  <V2PressedButton to="/playground">{nextBtn1}</V2PressedButton>
                  <V2PressedButton to="/library/javascript" variant="secondary">{nextBtn2}</V2PressedButton>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-16 text-white md:px-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <FiBookOpen className="mb-4 h-10 w-10 text-brand-teal" />
            <h2 className="text-4xl font-black tracking-tight">{bottomTitle}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              {bottomDesc}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <V2PressedButton to="/library/javascript">{bottomBtn1}</V2PressedButton>
              <V2PressedButton to="/onboarding" variant="secondary">{bottomBtn2}</V2PressedButton>
            </div>
          </div>
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2DocsPage
