import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/common/Header'
import SandboxLearningUI from '../components/learn/LessonViewer'
import SEO from '../components/common/SEO'
import { pageMetadata, getLanguageMetadata } from '../utils/seo'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'

const LearnPage: React.FC = () => {
  const { language = 'javascript', '*': splat } = useParams<{ language: string; '*': string }>()
  const lessonId = splat || undefined
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  // Auth guard: redirect guests to auth, unboarded users to onboarding
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth', { 
          state: { 
            from: { pathname: `/learn/${language}${lessonId ? '/' + lessonId : ''}` },
            intendedLanguage: language
          } 
        })
      } else if (!user.onboardingCompleted) {
        navigate('/onboarding', { state: { intendedLanguage: language } })
      }
    }
  }, [user, authLoading, navigate, language, lessonId])

  // Get metadata based on language
  const metadata = language ? getLanguageMetadata(language) : pageMetadata.learn

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!user || !user.onboardingCompleted) return null

  return (
    <>
      <SEO {...metadata} />
      <div className="bg-[#0a0e1a] h-screen flex flex-col overflow-hidden relative">
        {/* Subtle ambient background */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-brand-teal/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-brand-cyan/10 rounded-full blur-[100px]" />
        </div>

        <Header />
        <main className="flex-grow pt-20 pb-4 overflow-hidden relative z-10">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <SandboxLearningUI language={language} initialLessonId={lessonId} />
          </div>
        </main>
      </div>
    </>
  )
}

export default LearnPage
