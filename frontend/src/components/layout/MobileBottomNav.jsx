import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Radio, Bell, FolderKanban, FileText,
} from 'lucide-react';

const primaryItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/events', label: 'Events', icon: Radio },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/incidents', label: 'Cases', icon: FolderKanban },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export default function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.08] bg-[#080b10]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {primaryItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[10px] ${
                isActive ? 'text-soc-accent' : 'text-gray-500'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="truncate max-w-full px-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
