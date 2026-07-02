import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../ui/RoleBadge';
import LivePulseIndicator from '../ui/LivePulseIndicator';
import NotificationBell from './NotificationBell';
import MobileBottomNav from './MobileBottomNav';
import MobileNavDrawer from './MobileNavDrawer';
import WorkspaceBadge from './WorkspaceBadge';
import SidebarNav, { SidebarBrand } from './SidebarNav';
import ViewerNotice from '../ui/ViewerNotice';

export default function Layout() {
  const { user, logout, liveMonitoring } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 shrink-0 sticky top-0 h-screen border-r border-white/[0.06] bg-black/20 backdrop-blur-xl flex-col">
        <div className="p-6 border-b border-white/[0.06] shrink-0">
          <SidebarBrand />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <SidebarNav />
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
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors min-h-[44px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0e14]/90 backdrop-blur-md shrink-0">
          <div className="h-14 flex items-center px-4 sm:px-6 gap-3">
            <div className="md:hidden flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] min-h-[44px] min-w-[44px]"
                aria-label="Open navigation menu"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">ThreatLens AI</p>
                <WorkspaceBadge compact />
              </div>
            </div>
            <WorkspaceBadge />
            <span className="text-sm text-gray-400 hidden xl:block">Live AI Security Operations</span>
            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              <LivePulseIndicator active={liveMonitoring} compact />
              <NotificationBell />
              <RoleBadge role={user?.role} />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6 overflow-x-hidden overflow-y-auto relative">
          <div className="pointer-events-none absolute inset-0 bg-cyber-grid bg-grid opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative"
          >
            <ViewerNotice />
            <Outlet />
          </motion.div>
        </main>
      </div>

      <MobileBottomNav />
      <MobileNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
