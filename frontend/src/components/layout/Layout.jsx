import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Radio, Bell, FolderKanban, FileText, Shield, LogOut,
  ScrollText, ShieldAlert, Workflow,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../ui/RoleBadge';
import LivePulseIndicator from '../ui/LivePulseIndicator';
import NotificationBell from './NotificationBell';
import MobileBottomNav from './MobileBottomNav';
import MobileNavDrawer from './MobileNavDrawer';
import WorkspaceBadge from './WorkspaceBadge';
import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

const navSections = [
  {
    title: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Monitoring',
    items: [
      { to: '/events', label: 'Events', icon: Radio },
      { to: '/alerts', label: 'Alerts', icon: Bell },
      { to: '/incidents', label: 'Cases', icon: FolderKanban },
    ],
  },
  {
    title: 'Automation',
    items: [
      { to: '/playbooks', label: 'SOAR Queue', icon: Workflow },
      { to: '/rules', label: 'Detection Rules', icon: ShieldAlert },
    ],
  },
  {
    title: 'Governance',
    items: [
      { to: '/audit', label: 'Audit Logs', icon: ScrollText },
      { to: '/reports', label: 'Reports', icon: FileText },
    ],
  },
];

export default function Layout() {
  const { user, logout, liveMonitoring } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-white/[0.06] bg-black/20 backdrop-blur-xl flex-col">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-soc-accent/25 to-purple-500/15 border border-soc-accent/25 flex items-center justify-center shadow-glow-cyan">
              <Shield className="w-5 h-5 text-soc-accent" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm tracking-tight">ThreatLens AI</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">SOC Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-gray-600 font-medium">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 min-h-[44px] ${
                        isActive
                          ? 'nav-link-active font-medium'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0e14]/90 backdrop-blur-md">
          <div className="h-14 flex items-center px-4 sm:px-6 gap-3">
            <div className="lg:hidden flex items-center gap-2 min-w-0">
              <Shield className="w-5 h-5 text-soc-accent shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">ThreatLens AI</p>
                <WorkspaceBadge compact />
              </div>
            </div>
            <WorkspaceBadge />
            <span className="text-sm text-gray-400 hidden xl:block">Live AI Security Operations</span>
            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] min-h-[44px] min-w-[44px]"
                aria-label="More navigation"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <LivePulseIndicator active={liveMonitoring} compact />
              <NotificationBell />
              <RoleBadge role={user?.role} />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 overflow-x-hidden overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <MobileBottomNav />
      <MobileNavDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
