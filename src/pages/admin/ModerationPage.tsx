import React, { useEffect, useState } from 'react'
import { Trash2, Power, PowerOff, ShieldAlert, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../lib/api'

type Keyword = {
  id: string
  keyword: string
  category: string
  language: string
  is_active: boolean
  created_at: string
}

export const ModerationPage: React.FC = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    keyword: '',
    category: 'profanity',
    language: 'all',
  })

  const loadKeywords = async () => {
    try {
      const response = await api.request<Keyword[]>('/api/admin/moderation/keywords')
      setKeywords(response.data || [])
    } catch (error) {
      toast.error('Failed to load keywords')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKeywords()
  }, [])

  const handleCreate = async () => {
    try {
      const response = await api.request<Keyword>('/api/admin/moderation/keywords', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      if (response.data) {
        setKeywords([response.data, ...keywords])
      }
      setModalOpen(false)
      setFormData({ keyword: '', category: 'profanity', language: 'all' })
      toast.success('Keyword added')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create keyword')
    }
  }

  const handleToggleActive = async (keyword: Keyword) => {
    try {
      await api.request(`/api/admin/moderation/keywords/${keyword.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !keyword.is_active })
      })
      setKeywords(keywords.map(k =>
        k.id === keyword.id ? { ...k, is_active: !k.is_active } : k
      ))
      toast.success(keyword.is_active ? 'Keyword disabled' : 'Keyword enabled')
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle keyword')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this keyword?')) return
    try {
      await api.request(`/api/admin/moderation/keywords/${id}`, {
        method: 'DELETE'
      })
      setKeywords(keywords.filter(k => k.id !== id))
      toast.success('Keyword deleted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete keyword')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Moderation</h1>
          <p className="mt-1 text-sm text-slate-500">Manage banned keywords for project-wide censorship.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Add Keyword
        </button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Keyword</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Language</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {keywords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                      <p className="font-medium">No keywords found</p>
                      <p className="mt-1 text-xs">Add your first banned keyword to enable moderation.</p>
                    </td>
                  </tr>
                ) : (
                  keywords.map(keyword => (
                    <tr key={keyword.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-6 py-4 font-mono font-medium text-slate-900">
                        {keyword.keyword}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                          {keyword.category}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {keyword.language.toUpperCase()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            keyword.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {keyword.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(keyword)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            title={keyword.is_active ? 'Disable' : 'Enable'}
                          >
                            {keyword.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(keyword.id)}
                            className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Keyword Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Add Banned Keyword</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Keyword</label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={e => setFormData({ ...formData, keyword: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. badword"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                >
                  <option value="profanity">Profanity</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="spam">Spam</option>
                  <option value="general">General</option>
                </select>
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Language</label>
                <select
                  value={formData.language}
                  onChange={e => setFormData({ ...formData, language: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                >
                  <option value="all">All Languages</option>
                  <option value="vi">Vietnamese (vi)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.keyword.trim()}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Keyword
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModerationPage
