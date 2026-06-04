/**
 * TestCaseResults Component
 *
 * Displays individual test case results with pass/fail icons,
 * execution times, and expected vs actual output comparison.
 *
 * Validates Requirements: 15.2, 15.5, 8.2, 8.5
 */

import React, { useState } from 'react'
import { FiCheckCircle, FiXCircle, FiChevronDown, FiShield } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import type { TestRunResult, TestCaseResult } from '../../types/grading.types'

interface TestCaseResultsProps {
  testRunResult: TestRunResult
}

const TestCaseResults: React.FC<TestCaseResultsProps> = ({ testRunResult }) => {
  const { t } = useTranslation()
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set())

  const toggleExpanded = (testCaseId: string) => {
    setExpandedTests(prev => {
      const next = new Set(prev)
      if (next.has(testCaseId)) {
        next.delete(testCaseId)
      } else {
        next.add(testCaseId)
      }
      return next
    })
  }

  const passedCount = testRunResult.results.filter(r => r.passed).length
  const totalCount = testRunResult.results.length

  return (
    <div className="bg-bg-elevated rounded-xl border border-brand-teal/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <FiShield className="w-4 h-4 text-brand-teal" />
          Kiểm tra kết quả
        </h4>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${passedCount === totalCount ? 'text-green-400' : 'text-yellow-400'}`}
          >
            {t('grading.passed', { passed: passedCount, total: totalCount })}
          </span>
          <span className="text-xs text-gray-500">{testRunResult.totalExecutionTime}ms</span>
        </div>
      </div>

      {/* Test Case List */}
      <div className="space-y-2">
        {testRunResult.results.map((result, index) => (
          <TestCaseItem
            key={result.testCaseId}
            result={result}
            index={index}
            isExpanded={expandedTests.has(result.testCaseId)}
            onToggle={() => toggleExpanded(result.testCaseId)}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// TestCaseItem Sub-Component
// ============================================================================

interface TestCaseItemProps {
  result: TestCaseResult
  index: number
  isExpanded: boolean
  onToggle: () => void
}

const TestCaseItem: React.FC<TestCaseItemProps> = ({ result, index, isExpanded, onToggle }) => {
  return (
    <div
      className={`rounded-lg border transition-colors ${
        result.passed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
      }`}
    >
      {/* Header Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02] transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3">
          {/* Pass/Fail Icon */}
          {result.passed ? (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
              <FiCheckCircle className="w-4 h-4 text-green-400" />
            </span>
          ) : (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20">
              <FiXCircle className="w-4 h-4 text-red-400" />
            </span>
          )}

          <div>
            <span className="text-sm text-white font-medium">Bài kiểm tra #{index + 1}</span>
            <span className="text-xs text-gray-400 ml-2">{result.description}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{result.executionTime}ms</span>
          <FiChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-2 animate-slideDown">
          {result.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <p className="text-xs text-red-300 break-all">⚠️ Có lỗi xảy ra khi chạy bài kiểm tra này.</p>
              <p className="text-xs font-mono text-red-400/70 mt-1 break-all">{result.error}</p>
            </div>
          )}

          {!result.passed && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-bg-primary rounded-md p-3">
                  <p className="text-xs text-gray-500 mb-1">✅ Kết quả mong đợi</p>
                  <pre className="text-xs font-mono text-green-300 break-all whitespace-pre-wrap">
                    {JSON.stringify(result.expectedOutput, null, 2)}
                  </pre>
                </div>
                <div className="bg-bg-primary rounded-md p-3">
                  <p className="text-xs text-gray-500 mb-1">❌ Code của bạn cho ra</p>
                  <pre className="text-xs font-mono text-red-300 break-all whitespace-pre-wrap">
                    {result.actualOutput !== null
                      ? JSON.stringify(result.actualOutput, null, 2)
                      : 'null'}
                  </pre>
                </div>
              </div>
              <p className="text-xs text-slate-500 italic">💡 So sánh hai kết quả và kiểm tra lại code của bạn nhé!</p>
            </>
          )}

          {result.passed && (
            <div className="bg-bg-primary rounded-md p-3">
              <p className="text-xs text-gray-500 mb-1">Kết quả của bạn</p>
              <pre className="text-xs font-mono text-green-300 break-all whitespace-pre-wrap">
                {JSON.stringify(result.actualOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TestCaseResults
