import { FiActivity, FiAward, FiBell, FiBookOpen, FiCheckCircle, FiCompass, FiPlay, FiSettings, FiTarget, FiZap } from 'react-icons/fi'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'

const stats = [
  { label: 'Bài đã lưu', value: '12', icon: FiCheckCircle, note: 'sau completeLesson' },
  { label: 'Streak mẫu', value: '4', icon: FiZap, note: 'ngày liên tiếp' },
  { label: 'Điểm mẫu', value: '180', icon: FiAward, note: 'sandbox data' },
]

const activities = [
  ['Progress đã lưu', 'Hoàn thành “Đổi biến name” sau khi backend xác nhận.'],
  ['Mở khóa bài mới', 'Bài “Sửa output lời chào” đang là bước tiếp theo.'],
  ['Docs đã xem', 'Bạn mở note `console.log` để hiểu output.'],
]

const sideNav = [
  ['Overview', FiActivity],
  ['Journey', FiCompass],
  ['Goals', FiTarget],
  ['Notifications', FiBell],
  ['Settings', FiSettings],
]

const V2ProfilePage: React.FC = () => {
  return (
    <V2PublicShell>
      <main className="px-4 py-10 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px,1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-xl shadow-slate-200/70">
              <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal text-xl font-black text-slate-950 shadow-[0_4px_0_#0b889c]">L</div>
                <div>
                  <div className="font-black">Loopy learner</div>
                  <div className="text-xs font-bold text-slate-500">V2 sample profile</div>
                </div>
              </div>
              <div className="grid gap-2">
                {sideNav.map(([label, Icon], index) => {
                  const NavIcon = Icon as typeof FiActivity
                  return (
                    <button key={label as string} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black transition ${index === 0 ? 'bg-brand-teal text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                      <NavIcon /> {label as string}
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          <section className="grid gap-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 md:p-8">
              <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-brand-teal/20 blur-3xl" />
              <div className="relative grid gap-8 lg:grid-cols-[1fr,360px] lg:items-end">
                <div>
                  <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                    Profile v2 sandbox
                  </div>
                  <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                    Hồ sơ nên trả lời: học tiếp gì hôm nay?
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                    Profile v2 gom journey hiện tại, progress đã lưu, mục tiêu hôm nay và activity feed. Đây là dữ liệu mẫu để test layout logged-in app shell.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-5">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Current journey</div>
                  <h2 className="mt-2 text-2xl font-black">JavaScript Starter</h2>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[42%] rounded-full bg-brand-teal" />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">5/12 bài đã hoàn thành trong sample journey.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {stats.map(stat => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-brand-teal shadow-[0_4px_0_#54d9c4]"><Icon /></div>
                    <div className="text-4xl font-black">{stat.value}</div>
                    <div className="mt-1 font-black text-slate-700">{stat.label}</div>
                    <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{stat.note}</div>
                  </div>
                )
              })}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr,380px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiPlay /> Bước tiếp theo</div>
                <div className="rounded-[1.5rem] border border-brand-teal/30 bg-brand-teal/10 p-5">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-brand-ocean">Lesson mở khóa</div>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">Sửa output lời chào</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Bài này đang mở vì progress bài trước đã lưu thành công. Vào Learn để quan sát, chạy thử, kiểm tra và debug.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <V2PressedButton to="/v2/learn">Vào Learn v2</V2PressedButton>
                    <V2PressedButton to="/v2/library" variant="secondary">Xem Journey Map</V2PressedButton>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {activities.map(([title, description]) => (
                    <div key={title} className="flex gap-3 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-teal text-slate-950"><FiCheckCircle /></div>
                      <div>
                        <div className="font-black text-slate-800">{title}</div>
                        <div className="mt-1 text-sm leading-6 text-slate-600">{description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="grid gap-4">
                <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal"><FiTarget /> Mục tiêu hôm nay</div>
                  <h2 className="text-3xl font-black">Hoàn thành 1 lesson nhỏ.</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">Mục tiêu hỗ trợ thói quen, nhưng không thay thế Journey Map.</p>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between text-sm font-black">
                      <span>Tiến độ hôm nay</span>
                      <span className="text-brand-teal">0/1</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[12%] rounded-full bg-brand-teal" />
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiBell /> Thông báo mẫu</div>
                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 text-sm leading-6 text-slate-600">
                      Bài tiếp theo đã mở khóa sau khi progress lưu xong.
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 text-sm leading-6 text-slate-600">
                      Docs `console.log` có thể giúp bạn hiểu output trước khi debug.
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm md:p-8">
              <FiBookOpen className="mx-auto mb-4 h-10 w-10 text-brand-ocean" />
              <h2 className="text-3xl font-black tracking-tight">Profile v2 không phải leaderboard.</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Mục tiêu là giúp người học mới quay lại đúng bước tiếp theo, không tạo áp lực so sánh hoặc claim thành tích không có dữ liệu thật.
              </p>
            </div>
          </section>
        </div>
      </main>
    </V2PublicShell>
  )
}

export default V2ProfilePage
