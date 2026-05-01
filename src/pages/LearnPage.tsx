import React from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/common/Header'
import SandboxLearningUI from '../components/learn/LessonViewer'
import SEO from '../components/common/SEO'
import { pageMetadata, getLanguageMetadata } from '../utils/seo'

const LearnPage: React.FC = () => {
  const { language = 'javascript', '*': splat } = useParams<{ language: string; '*': string }>()
  const lessonId = splat || undefined

  // Get metadata based on language
  const metadata = language ? getLanguageMetadata(language) : pageMetadata.learn

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
