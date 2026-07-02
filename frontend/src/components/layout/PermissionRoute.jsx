import { useAuth } from '../../context/AuthContext';

export default function PermissionRoute({ permission, children }) {
  const { user, loading, can } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!can(permission)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-gray-400 mt-2">
            Your role ({user?.role}) does not have permission to access this page.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Required: <code className="text-gray-500">{permission}</code>
          </p>
        </div>
      </div>
    );
  }

  return children;
}
