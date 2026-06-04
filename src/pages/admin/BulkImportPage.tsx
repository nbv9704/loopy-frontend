import React, { useMemo, useState } from 'react'
import { Upload, CheckCircle, AlertCircle, FileJson, ArrowRight, Eye } from 'lucide-react'
import { contentService, BulkImportPayload } from '../../services/admin/content.service'

const BulkImportPage: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const preview = useMemo(() => {
    if (!jsonInput.trim()) {
      return null
    }

    try {
      const payload = JSON.parse(jsonInput) as BulkImportPayload
      const lessons = Array.isArray(payload.lessons) ? payload.lessons : []
      const testCaseCount = lessons.reduce((total, lesson) => {
        const testCases = lesson.testCases || lesson.test_cases || []
        return total + testCases.length
      }, 0)
      const missingRequired = lessons.filter(lesson => {
        const lessonId = lesson.lessonId || lesson.lesson_id
        const starterCode = lesson.starterCode || lesson.starter_code
        const solutionCode = lesson.solutionCode || lesson.solution_code
        const orderIndex = lesson.orderIndex ?? lesson.order_index
        return !lessonId || !lesson.title || !starterCode || !solutionCode || orderIndex === undefined
      }).length

      return {
        isValidJson: true,
        chapterId: payload.chapterId || payload.chapter_id || '',
        lessonCount: lessons.length,
        testCaseCount,
        missingRequired,
        parseError: '',
      }
    } catch (err) {
      return {
        isValidJson: false,
        chapterId: '',
        lessonCount: 0,
        testCaseCount: 0,
        missingRequired: 0,
        parseError: err instanceof Error ? err.message : 'JSON không hợp lệ',
      }
    }
  }, [jsonInput])

  const handleImport = async () => {
    setIsImporting(true)
    setError(null)
    setResult(null)

    try {
      const payload: BulkImportPayload = JSON.parse(jsonInput)
      const data = await contentService.bulkImport(payload)
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Lỗi phân tích JSON hoặc lỗi server')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-cyan-700">
            <Upload className="h-3.5 w-3.5" />
            Content ops
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Bulk Import Lessons
          </h1>
          <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
            Paste JSON, đọc preview, rồi import vào chapter đã chọn. Import lại sẽ thay test cases trong payload để tránh trùng.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {['1. Chọn chapter trong JSON', '2. Paste và validate payload', '3. Import và đọc kết quả'].map(step => (
          <div key={step} className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-black text-slate-700 shadow-sm">
            {step}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input area */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-teal-700" />
                <span className="text-sm font-black text-slate-700">JSON payload</span>
              </div>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "chapter_id": "...", "lessons": [...] }'
              className="h-[520px] w-full resize-none bg-white p-4 font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting || !preview?.isValidJson || preview.missingRequired > 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 py-4 font-black text-white shadow-sm transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className={`h-5 w-5 ${isImporting ? 'animate-spin' : ''}`} />
            <span>{isImporting ? 'Đang import...' : 'Import lessons'}</span>
          </button>
        </div>

        {/* Status / Result area */}
        <div className="space-y-6">
          {preview && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Eye className="h-5 w-5 text-teal-700" />
                <h2 className="text-lg font-black text-slate-950">Preview trước khi import</h2>
              </div>

              {!preview.isValidJson ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  JSON chưa hợp lệ: {preview.parseError}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500">Lessons</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{preview.lessonCount}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500">Test cases</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{preview.testCaseCount}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Chapter ID</p>
                    <p className="mt-1 break-all font-mono text-sm font-bold text-slate-700">
                      {preview.chapterId || 'Thiếu chapter_id/chapterId'}
                    </p>
                  </div>

                  {preview.missingRequired > 0 ? (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
                      {preview.missingRequired} lesson thiếu field bắt buộc. Cần có lesson_id, title,
                      starter_code, solution_code và order_index.
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                      Payload đủ field bắt buộc. Nếu import lại lesson đã có test cases, test cases trong payload sẽ thay thế bộ cũ để tránh trùng.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {error && (
            <div className="flex gap-4 rounded-lg border border-red-200 bg-red-50 p-6">
              <AlertCircle className="h-6 w-6 shrink-0 text-red-600" />
              <div>
                <h3 className="mb-1 font-black text-red-700">Import lỗi</h3>
                <p className="text-sm font-bold text-red-600">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="h-6 w-6 text-green-700" />
                <h3 className="font-black text-green-700">Import thành công</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-lg border border-green-200 bg-white p-4">
                  <p className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">Lessons</p>
                  <p className="text-2xl font-black text-slate-950">{result.lessonsCreated}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-white p-4">
                  <p className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">Test cases</p>
                  <p className="text-2xl font-black text-slate-950">{result.testCasesCreated}</p>
                </div>
              </div>

              {typeof result.testCasesReplaced === 'number' && result.testCasesReplaced > 0 && (
                <div className="mb-6 rounded-lg border border-green-200 bg-white p-4">
                  <p className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">Đã thay test cases cũ</p>
                  <p className="text-2xl font-black text-slate-950">{result.testCasesReplaced}</p>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-black text-slate-950">Lỗi nhỏ</h4>
                  <ul className="space-y-1">
                    {result.errors.map((err: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs font-bold text-slate-600">
                        <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-teal-700" />
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!result && !error && (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <FileJson className="mb-4 h-16 w-16 text-slate-300" />
              <p className="max-w-xs text-sm font-bold text-slate-500">
                Paste JSON để xem preview trước khi import.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkImportPage
