import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../ui/RoleBadge';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/events', label: 'Events' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/reports', label: 'Reports' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-soc-surface border-r border-soc-border flex flex-col">
        <div className="p-6 border-b border-soc-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-soc-accent/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-soc-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">ThreatLens AI</h1>
              <p className="text-xs text-gray-500">SOC Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, end, disabled }) =>
            disabled ? (
              <span
                key={to}
                className="block px-3 py-2 rounded-lg text-sm text-gray-600 cursor-not-allowed"
              >
                {label}
                <span className="ml-2 text-xs text-gray-700">Soon</span>
              </span>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-soc-accent/10 text-soc-accent font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {label}
              </NavLink>
            )
          )}
        </nav>

        <div className="p-4 border-t border-soc-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-soc-accent/20 flex items-center justify-center text-sm font-medium text-soc-accent">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <RoleBadge role={user?.role} />
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-soc-surface border-b border-soc-border flex items-center px-6">
          <span className="text-sm text-gray-400">Security Operations Center</span>
          <div className="ml-auto flex items-center gap-3">
            <RoleBadge role={user?.role} />
            <span className="w-2 h-2 rounded-full bg-soc-success animate-pulse" />
            <span className="text-xs text-gray-500">System Online</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
