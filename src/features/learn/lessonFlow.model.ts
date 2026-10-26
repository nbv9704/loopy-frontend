import type { LessonCheckResult } from '../../lib/api'
import type { GradingResult } from '../../types/grading.types'

export const getCheckMethodLabel = (validationType?: string, gradingMode?: string) => {
  if (validationType === 'stdout')
    return 'Chấm bằng test case output: chạy code và so sánh kết quả in ra.'
  if (validationType === 'function')
    return 'Chấm bằng test case function: gọi hàm của bạn với input mẫu.'
  if (validationType === 'exact') return 'Chấm bằng so khớp code mẫu sau khi chuẩn hóa.'
  if (validationType === 'regex') return 'Chấm bằng mẫu regex yêu cầu trong bài.'
  if (validationType === 'rule')
    return 'Chấm bằng rule tĩnh: kiểm tra keyword, pattern và yêu cầu bài học.'
  if (gradingMode) return `Chấm bằng deterministic checker (${gradingMode}).`
  return 'Chấm bằng deterministic checker của Loopy, không dùng AI để quyết định đúng/sai.'
}

export const createDebugCode = (source: string, language: string) => {
  if (language === 'python') {
    return `${source.trimEnd()}\n\n# Debug challenge: dòng dưới đang lỗi, hãy sửa hoặc xóa nó.\nprint(ten_chua_khai_bao)`
  }

  if (language === 'cpp') {
    return `${source.trimEnd()}\n\n// Debug challenge: dòng dưới đang lỗi, hãy sửa hoặc xóa nó.\ncout << ten_chua_khai_bao;`
  }

  return `${source.trimEnd()}\n\n// Debug challenge: dòng dưới đang lỗi, hãy sửa hoặc xóa nó.\nconsole.log(tenChuaKhaiBao);`
}

export function toLessonGradingResult(check: LessonCheckResult): GradingResult {
  return {
    submissionId: check.submissionId || 'deterministic',
    testScore: check.score,
    aiScore: null,
    finalScore: check.score,
    gradeLevel: check.passed ? 'excellent' : 'poor',
    gradedAt: new Date().toISOString(),
    executionTime: 0,
    feedback: {
      testResults: {
        testScore: check.score,
        totalExecutionTime: 0,
        results: check.checks.map((item, index) => ({
          testCaseId: `check-${index}`,
          passed: item.passed,
          actualOutput: check.output || '',
          expectedOutput: '',
          executionTime: 0,
          error: item.message || null,
          description: item.label,
        })),
      },
      aiAnalysis: null,
      overallFeedback: check.passed
        ? check.output || '✓ Trả lời chính xác!'
        : check.hint || 'Hãy kiểm tra kỹ yêu cầu bài học.',
    },
  }
}
