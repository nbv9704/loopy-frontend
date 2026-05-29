import { FiBookOpen, FiCode, FiCompass, FiFileText, FiHash, FiPlay, FiSearch, FiTerminal } from 'react-icons/fi'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'

const navGroups = [
  {
    title: 'JavaScript cơ bản',
    items: ['Console log', 'Biến', 'String template', 'Function', 'Điều kiện'],
  },
  {
    title: 'Python cơ bản',
    items: ['print()', 'input()', 'Biến', 'f-string', 'Lỗi thường gặp'],
  },
  {
    title: 'Khi bị kẹt',
    items: ['Đọc error', 'So sánh output', 'Dùng Playground'],
  },
]

const toc = ['Khi nào dùng docs?', 'Ví dụ console.log', 'Run khác Check', 'Đi tiếp ở đâu?']

function CodeBlock() {
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
        Output: Xin chào Loopy
      </div>
    </div>
  )
}

const V2DocsPage: React.FC = () => {
  return (
    <V2PublicShell>
      <main>
        <section className="relative overflow-hidden px-4 py-14 md:px-6 md:py-20">
          <div className="absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
              <div>
                <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                  Docs v2 sandbox
                </div>
                <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                  Docs là kệ tham khảo, không phải lộ trình chính.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  Người mới cần docs để tra cứu khi bị kẹt, nhưng vẫn nên quay lại Journey Map để học có thứ tự và lưu progress đúng cách.
                </p>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400"><FiSearch /> Tìm nhanh</div>
                <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-4 text-sm font-bold text-slate-500">
                  Thử tìm: `console.log`, `input`, `đọc error`
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[280px,1fr,280px]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiBookOpen /> Chủ đề</div>
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
              <div className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean"><FiFileText /> JavaScript reference</div>
              <h2 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">console.log dùng để xem output nhanh.</h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                Khi mới học, `console.log` là cách đơn giản nhất để kiểm tra một giá trị đang là gì. Nó phù hợp cho Playground và bước `Chạy thử` trong lesson.
              </p>

              <div className="my-8">
                <CodeBlock />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5">
                  <div className="mb-2 flex items-center gap-2 font-black text-slate-950"><FiPlay /> Khi dùng Chạy thử</div>
                  <p className="text-sm leading-6 text-slate-600">Dùng khi bạn muốn xem output thật. Đây là execute code, không phải validation.</p>
                </div>
                <div className="rounded-2xl border border-brand-teal/30 bg-brand-teal/10 p-5">
                  <div className="mb-2 flex items-center gap-2 font-black text-brand-ocean"><FiCompass /> Khi cần Kiểm tra</div>
                  <p className="text-sm leading-6 text-slate-600">Quay lại lesson để Loopy chấm bằng rule/test case và lưu progress sau khi hoàn thành.</p>
                </div>
              </div>

              <h3 className="mt-10 text-2xl font-black text-slate-950">Mẹo đọc output</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Nếu output không giống bạn nghĩ, hãy đổi từng biến nhỏ, chạy lại, rồi so sánh. Đừng sửa nhiều dòng cùng lúc khi mới học.
              </p>

              <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
                <div className="flex items-center gap-2 text-sm font-black text-brand-teal"><FiTerminal /> Từ docs sang thực hành</div>
                <p className="mt-3 text-sm leading-6 text-slate-400">Docs giúp hiểu khái niệm. Playground giúp thử nhanh. Learn giúp hoàn thành bài có kiểm tra.</p>
              </div>
            </article>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiHash /> Trong trang</div>
                <div className="grid gap-2">
                  {toc.map(item => (
                    <a key={item} href="#" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">{item}</a>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal">Next step</div>
                <h3 className="mt-3 text-2xl font-black">Đọc xong thì code thử.</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">Dùng Playground để thử khái niệm, hoặc vào Learn để được kiểm tra và lưu tiến độ.</p>
                <div className="mt-5 grid gap-3">
                  <V2PressedButton to="/playground">Mở Playground</V2PressedButton>
                  <V2PressedButton to="/library/javascript" variant="secondary">Vào Journey Map</V2PressedButton>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-16 text-white md:px-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <FiBookOpen className="mb-4 h-10 w-10 text-brand-teal" />
            <h2 className="text-4xl font-black tracking-tight">Docs hỗ trợ journey, không thay journey.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Khi chưa biết học tiếp gì, hãy quay lại Library thay vì lạc trong tài liệu tham khảo.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <V2PressedButton to="/library/javascript">Quay lại Journey Map</V2PressedButton>
              <V2PressedButton to="/sample-lesson" variant="secondary">Thử lesson mẫu</V2PressedButton>
            </div>
          </div>
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2DocsPage
