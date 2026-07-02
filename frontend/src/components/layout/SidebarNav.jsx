import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Radio, Bell, FolderKanban, FileText, Shield,
  ScrollText, ShieldAlert, Workflow,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';

export const navSections = [
  {
    title: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, permission: PERMISSIONS.DASHBOARD_READ }],
  },
  {
    title: 'Monitoring',
    items: [
      { to: '/events', label: 'Events', icon: Radio, permission: PERMISSIONS.EVENTS_READ },
      { to: '/alerts', label: 'Alerts', icon: Bell, permission: PERMISSIONS.ALERTS_READ },
      { to: '/incidents', label: 'Cases', icon: FolderKanban, permission: PERMISSIONS.CASES_READ },
    ],
  },
  {
    title: 'Automation',
    items: [
      { to: '/playbooks', label: 'SOAR Queue', icon: Workflow, permission: PERMISSIONS.PLAYBOOKS_READ },
      { to: '/rules', label: 'Detection Rules', icon: ShieldAlert, permission: PERMISSIONS.DETECTION_RULES_READ },
    ],
  },
  {
    title: 'Governance',
    items: [
      { to: '/audit', label: 'Audit Logs', icon: ScrollText, permission: PERMISSIONS.AUDIT_LOGS_READ },
      { to: '/reports', label: 'Reports', icon: FileText, permission: PERMISSIONS.REPORTS_READ },
    ],
  },
];

export default function SidebarNav({ onNavigate, className = '' }) {
  const { can } = useAuth();

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || can(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <nav className={`space-y-5 ${className}`}>
      {visibleSections.map((section) => (
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
                onClick={onNavigate}
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
  );
}

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-soc-accent/25 to-purple-500/15 border border-soc-accent/25 flex items-center justify-center shadow-glow-cyan">
        <Shield className="w-5 h-5 text-soc-accent" />
      </div>
      <div>
        <h1 className="font-bold text-white text-sm tracking-tight">ThreatLens AI</h1>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">SOC Platform</p>
      </div>
    </div>
  );
}
