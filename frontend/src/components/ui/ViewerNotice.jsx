import { useAuth } from '../../context/AuthContext';
import { isViewerRole } from '../../utils/permissions';
import { Eye } from 'lucide-react';

export default function ViewerNotice() {
  const { user } = useAuth();

  if (!user || !isViewerRole(user.role)) return null;

  return (
    <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-500/10 border border-gray-500/20 text-sm text-gray-300">
      <Eye className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
      <p>
        Signed in as <span className="text-white font-medium capitalize">{user.role}</span> — read-only access.
        Investigation, alert updates, and SOAR actions require an analyst or admin account.
      </p>
    </div>
  );
}
