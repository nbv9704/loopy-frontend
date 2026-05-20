import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Eye, Code, FileText, Zap, AlertCircle } from 'lucide-react'
import { contentService } from '../../services/admin/content.service'
import FullscreenLoader from '../../components/common/FullscreenLoader'

const LessonEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [chapters, setChapters] = useState<any[]>([])
  const [lesson, setLesson] = useState<any>({
    chapterId: '',
    lessonId: '',
    title: '',
    description: '',
    starterCode: '',
    taskDescription: '',
    hint: '',
    commonMistakes: '',
    solutionCode: '',
    isAhaLesson: false,
    orderIndex: 1,
  })

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const chaptersData = await contentService.getChapters()
      setChapters(chaptersData)

      if (!isNew && id) {
        const lessonData = await contentService.getLessonById(id)
        
        // Convert snake_case from DB to camelCase if needed, or map directly
        setLesson({
          ...lesson,
          id: lessonData.id,
          chapterId: lessonData.chapter_id || '',
          lessonId: lessonData.lesson_id || '',
          title: lessonData.title || '',
          description: lessonData.description || '',
          starterCode: lessonData.starter_code || '',
          taskDescription: lessonData.task_description || '',
          hint: lessonData.hint || '',
          commonMistakes: lessonData.common_mistakes || '',
          solutionCode: lessonData.solution_code || '',
          isAhaLesson: lessonData.is_aha_lesson || false,
          orderIndex: lessonData.order_index || 1,
        })
      }
    } catch (err: any) {
      setError('Lỗi tải dữ liệu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const apiPayload = {
        id: lesson.id,
        chapter_id: lesson.chapterId,
        lesson_id: lesson.lessonId,
        title: lesson.title,
        description: lesson.description,
        starter_code: lesson.starterCode,
        task_description: lesson.taskDescription,
        hint: lesson.hint,
        common_mistakes: lesson.commonMistakes,
        solution_code: lesson.solutionCode,
        is_aha_lesson: lesson.isAhaLesson,
        order_index: lesson.orderIndex,
        difficulty: lesson.difficulty || 'beginner',
        grading_mode: lesson.gradingMode || 'stdout'
      }
      
      await contentService.upsertLesson(apiPayload)
      navigate('/admin/dashboard') // Or to lesson list
    } catch (err: any) {
      setError('Lỗi lưu bài học: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const [isPreview, setIsPreview] = useState(false)

  if (loading) return <FullscreenLoader message="Đang tải bài học..." />

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isNew ? 'Thêm bài học mới' : 'Chỉnh sửa bài học'}
            </h1>
            <p className="text-slate-400">Thiết kế trải nghiệm See-Change-Build</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-medium border ${
              isPreview 
                ? 'bg-white/10 border-white/20 text-white' 
                : 'bg-transparent border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-5 h-5" />
            {isPreview ? 'Sửa nội dung' : 'Xem trước (Preview)'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-brand-teal text-slate-900 font-bold rounded-xl flex items-center gap-2 hover:bg-brand-teal/80 transition-all disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : <><Save className="w-5 h-5" /> Lưu bài học</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isPreview ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Mock Preview of the LearnPage UI */}
          <div className="bg-slate-900 border border-brand-teal/20 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5">
              <h2 className="text-2xl font-bold text-white mb-4">{lesson.title}</h2>
              <p className="text-slate-300 leading-relaxed">{lesson.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 bg-slate-950 border-r border-white/5">
                <div className="flex items-center gap-2 text-brand-cyan mb-3">
                  <Code className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Editor</span>
                </div>
                <pre className="text-brand-cyan font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {lesson.starterCode}
                </pre>
              </div>
              <div className="p-8 bg-slate-900">
                <div className="flex items-center gap-2 text-yellow-500 mb-4">
                  <Zap className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Nhiệm vụ</span>
                </div>
                <p className="text-white text-lg font-medium leading-snug mb-6">
                  {lesson.taskDescription}
                </p>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-slate-400 text-xs mb-1">Gợi ý:</p>
                  <p className="text-slate-300 text-sm italic">{lesson.hint}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center text-slate-500 text-xs italic">
            -- Đây là bản xem trước của giao diện phía người dùng --
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic Info */}
          <div className="md:col-span-2 space-y-6">
            <section className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-brand-teal mb-2">
                <FileText className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-wider text-sm">Thông tin cơ bản</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold ml-1">Chương</label>
                  <select 
                    value={lesson.chapterId}
                    onChange={(e) => setLesson({...lesson, chapterId: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-teal transition-colors"
                  >
                    <option value="">Chọn chương...</option>
                    {chapters.map(c => (
                      <option key={c.id} value={c.id}>{c.languageId} - {c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold ml-1">Slug (URL)</label>
                  <input 
                    type="text"
                    value={lesson.lessonId}
                    onChange={(e) => setLesson({...lesson, lessonId: e.target.value})}
                    placeholder="vi-du: loi-chao-dau-tien"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold ml-1">Tiêu đề bài học</label>
                <input 
                  type="text"
                  value={lesson.title}
                  onChange={(e) => setLesson({...lesson, title: e.target.value})}
                  placeholder="Nhập tiêu đề bài học..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-teal transition-colors"
                />
              </div>
            </section>

            {/* STEP 1: SEE */}
            <section className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-brand-cyan mb-2">
                <Eye className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-wider text-sm">Bước 1: See (Quan sát)</h2>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold ml-1">Giải thích khái niệm</label>
                <textarea 
                  value={lesson.description}
                  onChange={(e) => setLesson({...lesson, description: e.target.value})}
                  placeholder="Giải thích ngắn gọn khái niệm cho người mới..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-cyan transition-colors resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold ml-1">Mã nguồn mẫu (Starter Code)</label>
                <textarea 
                  value={lesson.starterCode}
                  onChange={(e) => setLesson({...lesson, starterCode: e.target.value})}
                  placeholder="Code mẫu để người dùng quan sát..."
                  className="w-full h-48 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-brand-cyan font-mono text-sm focus:outline-none focus:border-brand-cyan transition-colors resize-none"
                />
              </div>
            </section>

            {/* STEP 2: CHANGE */}
            <section className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                <Zap className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-wider text-sm">Bước 2: Change & Run (Thay đổi & Chạy)</h2>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold ml-1">Hướng dẫn nhiệm vụ</label>
                <textarea 
                  value={lesson.taskDescription}
                  onChange={(e) => setLesson({...lesson, taskDescription: e.target.value})}
                  placeholder="Yêu cầu người dùng thay đổi một phần nhỏ trong code mẫu..."
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold ml-1">Gợi ý (Hint)</label>
                  <textarea 
                    value={lesson.hint}
                    onChange={(e) => setLesson({...lesson, hint: e.target.value})}
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold ml-1">Lỗi thường gặp</label>
                  <textarea 
                    value={lesson.commonMistakes}
                    onChange={(e) => setLesson({...lesson, commonMistakes: e.target.value})}
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none resize-none"
                  />
                </div>
              </div>
            </section>

            {/* STEP 3: BUILD */}
            <section className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-green-500 mb-2">
                <Code className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-wider text-sm">Bước 3: Build (Xây dựng)</h2>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold ml-1">Kết quả mong đợi (Solution Code)</label>
                <textarea 
                  value={lesson.solutionCode}
                  onChange={(e) => setLesson({...lesson, solutionCode: e.target.value})}
                  placeholder="Mã nguồn sau khi đã hoàn thành nhiệm vụ..."
                  className="w-full h-48 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-green-400 font-mono text-sm focus:outline-none focus:border-green-500 transition-colors resize-none"
                />
              </div>
            </section>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <section className="bg-slate-900 border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4">Cài đặt nâng cao</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Aha! Moment?</span>
                  <input 
                    type="checkbox"
                    checked={lesson.isAhaLesson}
                    onChange={(e) => setLesson({...lesson, isAhaLesson: e.target.checked})}
                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-brand-teal focus:ring-brand-teal"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold">Thứ tự hiển thị</label>
                  <input 
                    type="number"
                    value={lesson.orderIndex}
                    onChange={(e) => setLesson({...lesson, orderIndex: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>
            </section>

            <div className="p-6 bg-brand-teal/5 border border-brand-teal/10 rounded-2xl">
              <h3 className="text-brand-teal font-bold text-sm mb-2">Lời khuyên</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Tránh viết giải thích quá dài. Hãy để người dùng học thông qua việc "thấy" và "thử". 
                Nhiệm vụ ở bước Change nên cực kỳ đơn giản để tạo cảm giác thành công nhanh chóng.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LessonEditorPage
