import AdminButton from '../AdminButton'
import ModalDialog from '../ModalDialog'
import { FiX } from 'react-icons/fi'
import { AdminSidebarContent } from './Sidebar'

/** Native dialog keeps background controls inert and supplies Escape/focus restoration. */
export default function AdminNavigationDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      id="admin-navigation"
      label="Điều hướng quản trị"
      className="fixed left-0 top-0 m-0 h-[100dvh] max-h-none w-80 max-w-[90vw] border-0 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/40"
    >
      <div className="flex h-full flex-col">
        <div className="flex justify-end border-b border-slate-200 px-4 py-2">
          <AdminButton
            size="icon"
            type="button"
            onClick={onClose}
            aria-label="Đóng điều hướng quản trị"
          >
            <FiX aria-hidden="true" />
          </AdminButton>
        </div>
        <AdminSidebarContent onNavigate={onClose} />
      </div>
    </ModalDialog>
  )
}
