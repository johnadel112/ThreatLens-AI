import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { X, Workflow, ShieldAlert, ScrollText, Bell } from 'lucide-react';

const moreItems = [
  { to: '/playbooks', label: 'SOAR Queue', icon: Workflow },
  { to: '/rules', label: 'Detection Rules', icon: ShieldAlert },
  { to: '/audit', label: 'Audit Logs', icon: ScrollText },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

export default function MobileNavDrawer({ open, onClose }) {
  if (!open) return null;

  return createPortal(
    <div className="lg:hidden fixed inset-0 z-[220]">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 rounded-t-2xl border-t border-white/10 bg-[#0a0e14] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">More</p>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white min-h-[44px] min-w-[44px]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {moreItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl border min-h-[52px] ${
                  isActive
                    ? 'border-soc-accent/30 bg-soc-accent/10 text-soc-accent'
                    : 'border-white/[0.06] bg-white/[0.02] text-gray-300'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
