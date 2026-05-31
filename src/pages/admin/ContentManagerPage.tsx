import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Download,
  Edit3,
  FileJson,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { contentService } from '../../services/admin/content.service'
import ContentEditorModal from '../../components/admin/ContentEditorModal'

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

const ITEMS_PER_PAGE = 50
const LANGUAGES = ['vi', 'en'] as const

const ContentStatsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-8 w-14 animate-pulse rounded bg-slate-100" />
      </div>
    ))}
  </div>
)

const ContentTableSkeleton = () => (
  <>
    {Array.from({ length: 6 }).map((_, index) => (
      <tr key={index}>
        <td className="max-w-xs px-5 py-4">
          <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
        </td>
        <td className="max-w-md px-5 py-4">
          <div className="h-4 w-full max-w-sm animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        </td>
        <td className="px-5 py-4">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-20 animate-pulse rounded bg-slate-100" />
        </td>
        <td className="px-5 py-4">
          <div className="flex justify-end gap-2">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </td>
      </tr>
    ))}
  </>
)

const ContentManagerPage: React.FC = () => {
  // State management
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedLanguage, setSelectedLanguage] = useState<'vi' | 'en'>('vi')
  const [searchQuery, setSearchQuery] = useState('')
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // Load categories on mount
  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      setIsLoadingCategories(true)
      setError(null)

      try {
        const data = await contentService.getContentCategories()
        if (!isMounted) return

        setCategories(data)
        if (data.length > 0) {
          setSelectedCategory(data[0].id)
        }
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách category')
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false)
        }
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  // Load content items when category, language, search, or page changes
  useEffect(() => {
    if (!selectedCategory) {
      setContentItems([])
      return
    }

    let isMounted = true

    const loadContentItems = async () => {
      setIsLoadingItems(true)
      setError(null)

      try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE
        const result = await contentService.getContentItems(
          selectedCategory,
          selectedLanguage,
          searchQuery || undefined,
          ITEMS_PER_PAGE,
          offset
        )

        if (isMounted) {
          setContentItems(result.items)
          setTotalItems(result.total)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Không thể tải danh sách content')
        }
      } finally {
        if (isMounted) {
          setIsLoadingItems(false)
        }
      }
    }

    loadContentItems()

    return () => {
      isMounted = false
    }
  }, [selectedCategory, selectedLanguage, searchQuery, currentPage, reloadKey])

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const shouldShowContentSkeleton = isLoadingCategories || isLoadingItems

  // Handle create new item
  const handleCreateNew = () => {
    setEditingItem(null)
    setIsEditorOpen(true)
  }

  // Handle edit item
  const handleEdit = (item: ContentItem) => {
    setEditingItem(item)
    setIsEditorOpen(true)
  }

  // Handle delete item
  const handleDelete = async (item: ContentItem) => {
    const confirmed = window.confirm(
      `Xóa content item "${item.key}"? Hành động này không thể hoàn tác.`
    )
    if (!confirmed) return

    setDeletingId(item.id)
    setError(null)

    try {
      await contentService.deleteContentItem(item.id)
      setContentItems(current => current.filter(i => i.id !== item.id))
      setTotalItems(current => current - 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa content item')
    } finally {
      setDeletingId(null)
    }
  }

  // Handle save item (create or update)
  const handleSaveItem = async (itemData: any) => {
    try {
      if (editingItem) {
        // Update existing item
        await contentService.updateContentItem(editingItem.id, itemData)
      } else {
        // Create new item
        await contentService.createContentItem(itemData)
      }

      setIsEditorOpen(false)
      setEditingItem(null)
      setReloadKey(current => current + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu content item')
    }
  }

  // Handle export
  const handleExport = async () => {
    setIsExporting(true)
    setError(null)

    try {
      const blob = await contentService.exportContent(selectedLanguage)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `content-${selectedLanguage}-${new Date().getTime()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể export content')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setError(null)

    try {
      const result = await contentService.importContent(file)
      setReloadKey(current => current + 1)

      if (result.errors.length > 0) {
        setError(`Import thành công với ${result.errors.length} lỗi: ${result.errors.join(', ')}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể import content')
    } finally {
      setIsImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-700">
            <FileJson className="h-3.5 w-3.5" />
            Content manager
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Content Items
          </h1>
          <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
            Quản lý nội dung tĩnh trên website, hỗ trợ VI/EN, export/import.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-teal-800"
        >
          <PlusCircle className="h-4 w-4" />
          Tạo item
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      {shouldShowContentSkeleton ? (
        <ContentStatsSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Tổng items</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{totalItems}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Category</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{categories.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Ngôn ngữ</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{LANGUAGES.length}</p>
          </div>
        </div>
      )}

      {/* Main content section */}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        {/* Filters */}
        <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[minmax(200px,280px),minmax(120px,160px),1fr,auto]">
          {/* Category filter */}
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              Category
            </span>
            <select
              value={selectedCategory}
              onChange={event => {
                setSelectedCategory(event.target.value)
                setCurrentPage(1)
              }}
              disabled={isLoadingCategories}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Chọn category...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          {/* Language filter */}
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              Language
            </span>
            <select
              value={selectedLanguage}
              onChange={event => {
                setSelectedLanguage(event.target.value as 'vi' | 'en')
                setCurrentPage(1)
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>

          {/* Search */}
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={event => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Tìm theo key hoặc value..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </label>

          {/* Action buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => setReloadKey(current => current + 1)}
              disabled={isLoadingItems || !selectedCategory}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingItems ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting || !selectedCategory}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Export"
              title="Export"
            >
              <Download className={`h-4 w-4 ${isExporting ? 'animate-spin' : ''}`} />
            </button>

            <label className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
              <Upload className={`h-4 w-4 ${isImporting ? 'animate-spin' : ''}`} />
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
                aria-label="Import"
              />
            </label>
          </div>
        </div>

        {/* Content table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  Key
                </th>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  Value
                </th>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  Updated
                </th>
                <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {shouldShowContentSkeleton && <ContentTableSkeleton />}

              {!shouldShowContentSkeleton && contentItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm font-bold text-slate-500">
                    Không có content item phù hợp.
                  </td>
                </tr>
              )}

              {!shouldShowContentSkeleton &&
                contentItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="max-w-xs px-5 py-4">
                      <div className="font-black text-slate-950">{item.key}</div>
                      {item.description && (
                        <div className="mt-1 text-xs font-medium text-slate-500">{item.description}</div>
                      )}
                    </td>

                    <td className="max-w-md px-5 py-4">
                      <div className="line-clamp-2 text-sm font-medium text-slate-600">
                        {item.value}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm font-bold text-slate-950">
                        {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-500">
                        {new Date(item.updatedAt).toLocaleTimeString('vi-VN')}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
                          aria-label="Sửa"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
            <div className="text-sm font-bold text-slate-600">
              Trang {currentPage} / {totalPages} ({totalItems} items)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(current => Math.max(1, current - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage(current => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Editor modal */}
      <ContentEditorModal
        isOpen={isEditorOpen}
        mode={editingItem ? 'edit' : 'create'}
        item={editingItem}
        categories={categories}
        selectedLanguage={selectedLanguage}
        onSave={handleSaveItem}
        onCancel={() => {
          setIsEditorOpen(false)
          setEditingItem(null)
        }}
      />
    </div>
  )
}

export default ContentManagerPage
