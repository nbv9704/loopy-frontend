import { useEffect, useState } from 'react'
import { X, AlertCircle } from 'lucide-react'

interface ContentCategory {
  id: string
  name: string
  description?: string
  displayOrder: number
}

interface ContentItem {
  id: string
  categoryId: string
  key: string
  language: 'vi' | 'en'
  value: string
  description?: string
  type?: 'text' | 'markdown' | 'html'
  createdAt: string
  updatedAt: string
}

interface ContentEditorModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  item?: ContentItem | null
  categories: ContentCategory[]
  selectedLanguage: 'vi' | 'en'
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

const ContentEditorModal: React.FC<ContentEditorModalProps> = ({
  isOpen,
  mode,
  item,
  categories,
  selectedLanguage,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    categoryId: '',
    key: '',
    language: selectedLanguage,
    value: '',
    description: '',
    type: 'text' as 'text' | 'markdown' | 'html',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form data when modal opens or item changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && item) {
        setFormData({
          categoryId: item.categoryId,
          key: item.key,
          language: item.language,
          value: item.value,
          description: item.description || '',
          type: item.type || 'text',
        })
      } else {
        setFormData({
          categoryId: categories[0]?.id || '',
          key: '',
          language: selectedLanguage,
          value: '',
          description: '',
          type: 'text',
        })
      }
      setErrors({})
    }
  }, [isOpen, mode, item, categories, selectedLanguage])

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.categoryId) {
      newErrors.categoryId = 'Vui lòng chọn category'
    }

    if (!formData.key || !formData.key.trim()) {
      newErrors.key = 'Vui lòng nhập key'
    } else if (formData.key.length > 255) {
      newErrors.key = 'Key không được vượt quá 255 ký tự'
    }

    if (!formData.value || !formData.value.trim()) {
      newErrors.value = 'Vui lòng nhập nội dung'
    } else if (formData.value.length > 5000) {
      newErrors.value = 'Nội dung không được vượt quá 5000 ký tự'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      if (mode === 'edit') {
        // For edit, only send value, description, and type
        await onSave({
          value: formData.value,
          description: formData.description,
          type: formData.type,
        })
      } else {
        // For create, send all fields
        await onSave({
          categoryId: formData.categoryId,
          key: formData.key,
          language: formData.language,
          value: formData.value,
          description: formData.description,
          type: formData.type,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-black text-slate-950">
            {mode === 'edit' ? 'Sửa Content Item' : 'Tạo Content Item Mới'}
          </h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-slate-700">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
              disabled={mode === 'edit' || isLoading}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="">Chọn category...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <div className="mt-1 flex items-center gap-2 text-sm font-bold text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.categoryId}
              </div>
            )}
          </div>

          {/* Key */}
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-slate-700">
              Key {mode === 'edit' && <span className="text-xs text-slate-500">(read-only)</span>}
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={e => setFormData({ ...formData, key: e.target.value })}
              disabled={mode === 'edit' || isLoading}
              placeholder="e.g., nav.learn, landing.hero.title"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            {errors.key && (
              <div className="mt-1 flex items-center gap-2 text-sm font-bold text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.key}
              </div>
            )}
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-slate-700">
              Language {mode === 'edit' && <span className="text-xs text-slate-500">(read-only)</span>}
            </label>
            <select
              value={formData.language}
              onChange={e => setFormData({ ...formData, language: e.target.value as 'vi' | 'en' })}
              disabled={mode === 'edit' || isLoading}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-slate-700">
              Type
            </label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as 'text' | 'markdown' | 'html' })}
              disabled={isLoading}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="text">Plain Text</option>
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-slate-700">
              Value <span className="text-xs text-slate-500">({formData.value.length}/5000)</span>
            </label>
            <textarea
              value={formData.value}
              onChange={e => setFormData({ ...formData, value: e.target.value })}
              disabled={isLoading}
              placeholder="Nhập nội dung..."
              rows={6}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            {errors.value && (
              <div className="mt-1 flex items-center gap-2 text-sm font-bold text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.value}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-slate-700">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              placeholder="Ghi chú về content item này..."
              rows={3}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContentEditorModal
