import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications({ limit: 50 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleMarkRead(id) {
    await markNotificationRead(id);
    await fetchNotifications();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    await fetchNotifications();
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="SOC alerts for incidents, playbooks, and assignments"
        icon={Bell}
        action={
          unreadCount > 0 ? (
            <button type="button" onClick={handleMarkAllRead} className="btn-ghost text-sm">
              Mark all read ({unreadCount})
            </button>
          ) : null
        }
      />

      {loading ? (
        <TableSkeleton rows={5} />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You'll be notified when incidents are created, playbooks need approval, or cases are assigned." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <GlassCard key={n.id} className={!n.read ? 'border-soc-accent/20' : ''}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{n.message}</p>
                  <p className="text-[10px] text-gray-600 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {n.link && (
                    <Link to={n.link} className="text-xs text-soc-accent hover:underline">
                      Open
                    </Link>
                  )}
                  {!n.read && (
                    <button type="button" onClick={() => handleMarkRead(n.id)} className="text-xs text-gray-500 hover:text-white">
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
