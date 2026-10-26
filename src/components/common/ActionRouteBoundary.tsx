import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { ActionRoutePath } from '../../lib/actionRoute'

export default function ActionRouteBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <ActionRoutePath.Provider value={location.pathname}>{children}</ActionRoutePath.Provider>
}
