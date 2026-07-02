import { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import NotificationItem from '../components/layout/NotificationItem';

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
        <GlassCard padding={false} className="overflow-hidden divide-y divide-white/[0.05]">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={handleMarkRead}
            />
          ))}
        </GlassCard>
      )}
    </div>
  );
}
