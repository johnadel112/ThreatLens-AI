import { createPortal } from 'react-dom';
import { LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../ui/RoleBadge';
import SidebarNav, { SidebarBrand } from './SidebarNav';

export default function MobileNavDrawer({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!open) return null;

  async function handleLogout() {
    onClose();
    await logout();
    navigate('/login');
  }

  return createPortal(
    <div className="md:hidden fixed inset-0 z-[220]">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-[min(100vw-3rem,18rem)] flex flex-col border-r border-white/10 bg-[#0a0e14] shadow-2xl">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <SidebarBrand />
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white min-h-[44px] min-w-[44px]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <SidebarNav onNavigate={onClose} />
        </div>

        <div className="p-4 border-t border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white/[0.02]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-soc-accent/30 to-purple-500/20 flex items-center justify-center text-sm font-semibold text-soc-accent border border-soc-accent/20">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate font-medium">{user?.name}</p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <RoleBadge role={user?.role} />
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white min-h-[44px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
