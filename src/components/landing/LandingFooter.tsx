const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative px-6 md:px-12 py-8 border-t border-white/5">
      <div className="max-w-[1600px] mx-auto text-center">
        <p className="text-slate-500 text-sm">
          © {currentYear} Loopy. Nền tảng học lập trình tương tác.
        </p>
      </div>
    </footer>
  )
}

export default LandingFooter
