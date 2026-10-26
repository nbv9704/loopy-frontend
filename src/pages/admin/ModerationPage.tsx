import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/admin/authStore'
import ModerationManager from '../../features/admin-moderation/ModerationManager'

export default function ModerationPage() {
  const revision = useAuthStore(state => state.sessionRevision)
  const location = useLocation()
  return <ModerationManager key={`${revision}:${location.key}`} />
}
