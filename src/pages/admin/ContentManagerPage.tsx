import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/admin/authStore'
import CmsManager from '../../features/admin-cms/CmsManager'

export default function ContentManagerPage() {
  const revision = useAuthStore(state => state.sessionRevision)
  const location = useLocation()
  return <CmsManager key={`${revision}:${location.key}`} />
}
