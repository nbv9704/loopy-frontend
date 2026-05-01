import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import headerLogo from '../../assets/images/logos/header/logo-w256.png'

const LandingNav: React.FC = () => {
  return (
    <nav className="relative z-50 px-6 md:px-12 py-6">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center"
        >
          <Link to="/">
            <img src={headerLogo} alt="Loopy" className="h-10" />
          </Link>
        </motion.div>
      </div>
    </nav>
  )
}

export default LandingNav
