import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ExternalLink,
  X,
  FileText,
  Video,
  BookOpen as BookIcon,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import SEO from '../components/common/SEO'
import { pageMetadata } from '../utils/seo'
import { useDocumentationTechnologies, useDocumentationLinks } from '../hooks/useContent'
import { getIconComponent } from '../utils/iconMapper'
import type { DocumentationTechnology } from '../types/content.types'
import { DocCardSkeleton } from '../components/common/SkeletonLoader'

const DocsPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Fetch documentation technologies from API
  const { data: technologies, isLoading, isError, refetch } = useDocumentationTechnologies()

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDoc, setSelectedDoc] = useState<DocumentationTechnology | null>(null)
  const itemsPerPage = 6

  // Fetch links for selected technology
  const { data: links, isLoading: linksLoading } = useDocumentationLinks(selectedDoc?.id || '')

  const filteredDocs = (technologies || []).filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDocs = filteredDocs.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'docs':
        return FileText
      case 'video':
        return Video
      case 'article':
        return BookIcon
      default:
        return FileText
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'docs':
        return 'text-brand-teal'
      case 'video':
        return 'text-red-400'
      case 'article':
        return 'text-brand-cyan'
      default:
        return 'text-slate-400'
    }
  }

  return (
    <>
      <SEO {...pageMetadata.docs} />
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-brand-cyan/10 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-brand-ocean/10 rounded-full blur-[100px] animate-pulse"
            style={{ animationDelay: '1.5s' }}
          />
        </div>

        <Header />

        <main className="flex-grow pt-32 pb-8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 text-center md:p-10">
              <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-sm font-bold text-brand-teal">
                <BookIcon className="h-4 w-4" /> Resource Shelf
              </div>
              <h1 className="text-4xl font-black text-white mb-4 md:text-6xl">Tài nguyên khi bạn bị kẹt.</h1>
              <p className="mx-auto max-w-3xl text-slate-400 text-lg leading-8">
                Docs là kệ tham khảo, không phải lộ trình chính. Khi chưa biết bắt đầu từ đâu, hãy quay lại Journey Map để học từng bước.
              </p>
              <button
                onClick={() => navigate('/languages')}
                className="mx-auto mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition-colors hover:border-brand-teal/40 hover:text-brand-teal"
              >
                Quay lại lộ trình <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {Array.from({ length: 6 }).map((_, index) => (
                  <DocCardSkeleton key={index} />
                ))}
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <p className="text-slate-400 mb-4">{t('docs.errorLoading')}</p>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-3 bg-brand-teal text-[#0a0e1a] rounded-lg font-semibold hover:bg-brand-cyan transition-colors"
                >
                  {t('docs.retry')}
                </button>
              </div>
            )}

            {/* Content */}
            {!isLoading && !isError && technologies && (
              <>
                {/* Search Bar */}
                <div className="mb-8">
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-5 flex items-center gap-4 hover:border-brand-teal/50 transition-all duration-300">
                      <Search className="w-6 h-6 text-brand-teal" />
                      <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('docs.searchPlaceholder')}
                        className="flex-1 bg-transparent text-white text-base focus:outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-8 text-center text-sm text-slate-500">
                  Gợi ý: ưu tiên tài liệu chính thức và bài beginner-friendly trước khi đào sâu.
                </div>

                {/* Documentation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {currentDocs.map((doc, index) => {
                    const Icon = getIconComponent(doc.icon)
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { delay: index * 0.05, duration: 0.4 },
                        }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => setSelectedDoc(doc)}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 cursor-pointer hover:border-brand-teal/50 hover:bg-white/10 hover:shadow-lg hover:shadow-brand-teal/20 transition-all duration-300 group"
                      >
                        <Icon className="text-5xl text-brand-teal mb-6 group-hover:scale-110 transition-transform duration-300" />
                        <h3 className="text-white font-bold text-xl mb-2">{doc.name}</h3>
                        <p className="text-slate-400 text-sm mb-4">{doc.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-sm">
                            {doc.linkCount} {t('docs.resources')}
                          </span>
                          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-brand-teal transition-colors duration-300" />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {filteredDocs.length === 0 && (
                  <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-12 text-center">
                    <p className="text-slate-400">{t('docs.noResults')}</p>
                    <button
                      onClick={() => setSearch('')}
                      className="mt-4 rounded-xl bg-brand-teal px-5 py-2 font-bold text-[#0a0e1a]"
                    >
                      Xóa tìm kiếm
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {filteredDocs.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {t('docs.previous')}
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-all ${
                            currentPage === page
                              ? 'bg-brand-teal text-[#0a0e1a]'
                              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {t('docs.next')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Links Modal */}
        <AnimatePresence>
          {selectedDoc && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedDoc(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-[#0a0e1a] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {React.createElement(getIconComponent(selectedDoc.icon), {
                      className: 'text-4xl text-brand-teal',
                    })}
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedDoc.name}</h2>
                      <p className="text-slate-400 text-sm">{selectedDoc.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                  {linksLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-slate-400">{t('docs.loadingDocs')}</p>
                    </div>
                  ) : links && links.length > 0 ? (
                    <>
                      <p className="text-slate-300 text-sm mb-6">{t('docs.selectDoc')}</p>
                      <div className="space-y-3">
                        {links.map((link, index) => {
                          const TypeIcon = getTypeIcon(link.type || 'docs')
                          const typeColor = getTypeColor(link.type || 'docs')
                          return (
                            <motion.a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0, transition: { delay: index * 0.1 } }}
                              className="block p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-teal/50 rounded-xl transition-all duration-200 group"
                            >
                              <div className="flex items-start gap-3">
                                <TypeIcon className={`w-5 h-5 mt-0.5 ${typeColor}`} />
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-white font-semibold mb-1 group-hover:text-brand-teal transition-colors">
                                    {link.title}
                                  </h3>
                                  {link.description && (
                                    <p className="text-slate-400 text-sm">{link.description}</p>
                                  )}
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-brand-teal transition-colors flex-shrink-0" />
                              </div>
                            </motion.a>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-slate-400">{t('docs.noDocsYet')}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>
    </>
  )
}

export default DocsPage
