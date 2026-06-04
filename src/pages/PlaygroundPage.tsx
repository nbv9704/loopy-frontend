import { useLocation } from 'react-router-dom'
import Header from '../components/common/Header'
import PlaygroundMultiFileUI from '../components/playground/MultiFileEditor'
import SEO from '../components/common/SEO'
import { pageMetadata } from '../utils/seo'

interface PlaygroundLocationState {
  code?: string
  language?: string
  lessonTitle?: string
}

const PlaygroundPage: React.FC = () => {
  const location = useLocation()
  const state = location.state as PlaygroundLocationState | null

  return (
    <>
      <SEO {...pageMetadata.playground} />
      <div className="bg-[#0a0e1a] h-screen flex flex-col overflow-hidden relative">
        {/* Subtle ambient background */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-brand-ocean/10 rounded-full blur-[100px]" />
        </div>

        <Header />
        <main className="flex-grow pt-20 pb-4 overflow-hidden relative z-10">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <PlaygroundMultiFileUI
              initialCode={state?.code}
              initialLanguage={state?.language}
              initialTitle={state?.lessonTitle}
            />
          </div>
        </main>
      </div>
    </>
  )
}

export default PlaygroundPage
