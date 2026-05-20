/**
 * Icon Mapper — Maps icon name strings from the CMS API to React icon components.
 */

import {
  FiCode,
  FiBook,
  FiZap,
  FiShield,
  FiCpu,
  FiLayers,
  FiGlobe,
  FiTerminal,
  FiDatabase,
  FiGitBranch,
  FiAward,
  FiUsers,
  FiBookOpen,
  FiTrendingUp,
  FiCheckCircle,
  FiStar,
  FiHeart,
  FiPlay,
  FiMonitor,
  FiSmartphone,
  FiCloud,
  FiLock,
  FiRefreshCw,
  FiSettings,
  FiTarget,
  FiFeather,
} from 'react-icons/fi'
import type { IconType } from 'react-icons'

const iconMap: Record<string, IconType> = {
  code: FiCode,
  book: FiBook,
  zap: FiZap,
  shield: FiShield,
  cpu: FiCpu,
  layers: FiLayers,
  globe: FiGlobe,
  terminal: FiTerminal,
  database: FiDatabase,
  'git-branch': FiGitBranch,
  award: FiAward,
  users: FiUsers,
  'book-open': FiBookOpen,
  'trending-up': FiTrendingUp,
  'check-circle': FiCheckCircle,
  star: FiStar,
  heart: FiHeart,
  play: FiPlay,
  monitor: FiMonitor,
  smartphone: FiSmartphone,
  cloud: FiCloud,
  lock: FiLock,
  'refresh-cw': FiRefreshCw,
  settings: FiSettings,
  target: FiTarget,
  feather: FiFeather,
  trophy: FiAward,
}

/**
 * Get a React icon component by its string name.
 * Falls back to FiCode if the icon name is not found.
 */
export function getIconComponent(iconName: string): IconType {
  return iconMap[iconName] || FiCode
}
