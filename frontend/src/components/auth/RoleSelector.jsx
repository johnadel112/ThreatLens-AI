import { Eye, Shield, UserCog, Users } from 'lucide-react';

const ROLES = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Read-only dashboard',
    icon: Users,
  },
  {
    value: 'analyst',
    label: 'Analyst',
    description: 'Investigate & approve SOAR',
    icon: Shield,
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full platform access',
    icon: UserCog,
  },
];

export default function RoleSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-400">Role</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Select account role">
        {ROLES.map(({ value: roleValue, label, description, icon: Icon }) => {
          const selected = value === roleValue;
          return (
            <button
              key={roleValue}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(roleValue)}
              className={`text-left p-3 rounded-xl border transition-all min-h-[44px] ${
                selected
                  ? 'border-soc-accent/40 bg-soc-accent/10 shadow-glow-cyan'
                  : 'border-white/[0.08] bg-black/20 hover:border-white/15 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 shrink-0 ${selected ? 'text-soc-accent' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-300'}`}>
                  {label}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 leading-snug pl-6">{description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
