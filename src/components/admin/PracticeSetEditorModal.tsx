import { useState, useEffect } from 'react'
import apiClient from '../../services/admin/apiClient'

interface Question {
  id?: string
  type: 'true_false' | 'multiple_choice' | 'multiple_select' | 'fill_blank'
  title?: string
  prompt: string
  options?: string[]
  correctAnswer?: string
  explanation?: string
  points?: number
  orderIndex?: number
}

interface PracticeSet {
  id: string
  title: string
  description?: string
  topic?: string
  languageId?: string
  difficulty: 'easy' | 'medium' | 'hard'
  visibility: 'public' | 'private' | 'unlisted' | 'official'
  status: 'draft' | 'published'
  questions?: Question[]
}

interface Props {
  set?: PracticeSet | null
  onClose: () => void
  onSave: () => void
}

export function PracticeSetEditorModal({ set, onClose, onSave }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Partial<PracticeSet>>({
    title: '',
    description: '',
    topic: '',
    difficulty: 'medium',
    visibility: 'private',
    status: 'draft',
    questions: [],
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    type: 'multiple_choice',
    prompt: '',
    options: ['', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 10,
  })

  useEffect(() => {
    if (set) {
      setFormData(set)
      setQuestions(set.questions || [])
    }
  }, [set])

  const handleAddQuestion = () => {
    if (!currentQuestion.prompt.trim()) {
      setError('Question prompt is required')
      return
    }

    if (currentQuestion.type === 'multiple_choice' && !currentQuestion.correctAnswer) {
      setError('Please select a correct answer')
      return
    }

    if (editingQuestionIndex !== null) {
      const updated = [...questions]
      updated[editingQuestionIndex] = { ...currentQuestion, orderIndex: editingQuestionIndex }
      setQuestions(updated)
      setEditingQuestionIndex(null)
    } else {
      setQuestions([...questions, { ...currentQuestion, orderIndex: questions.length }])
    }

    setCurrentQuestion({
      type: 'multiple_choice',
      prompt: '',
      options: ['', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 10,
    })
    setError(null)
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleEditQuestion = (index: number) => {
    setCurrentQuestion(questions[index])
    setEditingQuestionIndex(index)
  }
  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!formData.title?.trim()) {
        setError('Title is required')
        return
      }

      if (questions.length === 0) {
        setError('At least one question is required')
        return
      }

      const payload = {
        title: formData.title,
        description: formData.description || '',
        topic: formData.topic || '',
        difficulty: formData.difficulty,
        visibility: formData.visibility,
        status: formData.status,
        questions,
      }

      if (set?.id) {
        await apiClient.put(`/api/admin/practice/sets/${set.id}`, payload)
      } else {
        await apiClient.post('/api/admin/practice/sets', payload)
      }

      onSave()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save practice set')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {set ? 'Edit Practice Set' : 'Create Practice Set'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-700 p-2 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Practice Set Title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of this practice set"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Topic
                </label>
                <input
                  type="text"
                  value={formData.topic || ''}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Arrays, Loops"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="official">Official (For PvP)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Questions ({questions.length})</h3>
              <button
                onClick={() => setEditingQuestionIndex(null)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                + Add Question
              </button>
            </div>

            {/* Question Editor */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Question Type
                  </label>
                  <select
                    value={currentQuestion.type}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="multiple_select">Multiple Select</option>
                    <option value="fill_blank">Fill in the Blank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Prompt *
                  </label>
                  <textarea
                    value={currentQuestion.prompt}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, prompt: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter the question"
                    rows={3}
                  />
                </div>

                {currentQuestion.type === 'multiple_choice' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      {(currentQuestion.options || []).map((option, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="radio"
                            checked={currentQuestion.correctAnswer === option}
                            onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: option })}
                            className="mt-2"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const updated = [...(currentQuestion.options || [])]
                              updated[i] = e.target.value
                              setCurrentQuestion({ ...currentQuestion, options: updated })
                            }}
                            placeholder={`Option ${i + 1}`}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Explanation
                  </label>
                  <textarea
                    value={currentQuestion.explanation || ''}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why this is the correct answer"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    value={currentQuestion.points || 10}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddQuestion}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                  >
                    {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
                  </button>
                  {editingQuestionIndex !== null && (
                    <button
                      onClick={() => {
                        setEditingQuestionIndex(null)
                        setCurrentQuestion({
                          type: 'multiple_choice',
                          prompt: '',
                          options: ['', '', ''],
                          correctAnswer: '',
                          explanation: '',
                          points: 10,
                        })
                      }}
                      className="px-4 py-2 bg-slate-300 text-slate-700 rounded hover:bg-slate-400 font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="bg-white p-3 rounded border border-slate-200 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">{i + 1}. {q.prompt}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      Type: {q.type} | Points: {q.points || 10}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditQuestion(i)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveQuestion(i)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PracticeSetEditorModal
