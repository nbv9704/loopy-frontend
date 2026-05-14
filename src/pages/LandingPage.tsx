import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import LandingNav from '../components/landing/LandingNav'
import HeroSectionV2 from '../components/landing/HeroSection'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import LanguagesSection from '../components/landing/LanguagesSection'
import StatsSection from '../components/landing/StatsSection'
import FeaturesSectionV2 from '../components/landing/FeaturesSection'
import CTASection from '../components/landing/CTASection'
import LandingFooter from '../components/landing/LandingFooter'
import SEO from '../components/common/SEO'
import { pageMetadata } from '../utils/seo'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Container ref for global scroll tracking
  const containerRef = useRef<HTMLDivElement>(null)

  // Separate refs for each section
  const heroRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const languagesRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  // Individual scroll progress for each section
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const { scrollYProgress: howItWorksProgress } = useScroll({
    target: howItWorksRef,
    offset: ['start start', 'end start'],
  })

  const { scrollYProgress: languagesProgress } = useScroll({
    target: languagesRef,
    offset: ['start start', 'end start'],
  })

  const { scrollYProgress: statsProgress } = useScroll({
    target: statsRef,
    offset: ['start start', 'end start'],
  })

  const { scrollYProgress: featuresProgress } = useScroll({
    target: featuresRef,
    offset: ['start start', 'end start'],
  })

  const { scrollYProgress: ctaProgress } = useScroll({
    target: ctaRef,
    offset: ['start start', 'end start'],
  })

  // Transform values - blur only when section has scrolled past viewport top
  const heroOpacity = useTransform(heroProgress, [0.5, 1], [1, 0.3])
  const heroBlur = useTransform(heroProgress, [0.5, 1], [0, 10])

  const howItWorksOpacity = useTransform(howItWorksProgress, [0.5, 1], [1, 0.3])
  const howItWorksBlur = useTransform(howItWorksProgress, [0.5, 1], [0, 8])

  const languagesOpacity = useTransform(languagesProgress, [0.5, 1], [1, 0.3])
  const languagesBlur = useTransform(languagesProgress, [0.5, 1], [0, 8])

  const statsOpacity = useTransform(statsProgress, [0.5, 1], [1, 0.3])
  const statsBlur = useTransform(statsProgress, [0.5, 1], [0, 8])

  const featuresOpacity = useTransform(featuresProgress, [0.5, 1], [1, 0.3])
  const featuresBlur = useTransform(featuresProgress, [0.5, 1], [0, 8])

  const ctaOpacity = useTransform(ctaProgress, [0.5, 1], [1, 0.3])
  const ctaBlur = useTransform(ctaProgress, [0.5, 1], [0, 6])

  const handleStartCoding = () => {
    if (user) {
      navigate('/select-language')
    } else {
      navigate('/auth')
    }
  }

  const handleViewDocs = () => {
    navigate('/docs')
  }

  return (
    <>
      <SEO {...pageMetadata.home} />
      <div ref={containerRef} className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div
            className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse"
            style={{ animationDuration: '8s' }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-cyan/10 rounded-full blur-[100px] animate-pulse"
            style={{ animationDuration: '10s', animationDelay: '2s' }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(84,217,196,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(84,217,196,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative z-10">
          <LandingNav />

          <HeroSectionV2
            sectionRef={heroRef}
            opacity={heroOpacity}
            blur={heroBlur}
            onStartCoding={handleStartCoding}
            onViewDocs={handleViewDocs}
          />

          <HowItWorksSection
            sectionRef={howItWorksRef}
            opacity={howItWorksOpacity}
            blur={howItWorksBlur}
          />

          <LanguagesSection
            sectionRef={languagesRef}
            opacity={languagesOpacity}
            blur={languagesBlur}
          />

          <StatsSection sectionRef={statsRef} opacity={statsOpacity} blur={statsBlur} />

          <FeaturesSectionV2
            sectionRef={featuresRef}
            opacity={featuresOpacity}
            blur={featuresBlur}
          />

          <CTASection
            sectionRef={ctaRef}
            opacity={ctaOpacity}
            blur={ctaBlur}
            onStartCoding={handleStartCoding}
          />

          <LandingFooter />
        </div>
      </div>
    </>
  )
}

export default LandingPage
