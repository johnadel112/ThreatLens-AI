import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from '../../api/notifications';
import { usePolling } from '../../hooks/usePolling';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const [listData, countData] = await Promise.all([
        getNotifications({ limit: 8 }),
        getUnreadCount(),
      ]);
      setNotifications(listData.notifications || []);
      setUnreadCount(countData.unreadCount || 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  usePolling(fetchNotifications, 15000, true);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleMarkRead(id) {
    await markNotificationRead(id);
    await fetchNotifications();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    await fetchNotifications();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-soc-critical text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/[0.08] bg-[#0d1117]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <p className="text-sm font-medium text-white">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="text-[10px] text-soc-accent hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.link || '/notifications'}
                  onClick={() => {
                    if (!n.read) handleMarkRead(n.id);
                    setOpen(false);
                  }}
                  className={`block px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] ${!n.read ? 'bg-soc-accent/5' : ''}`}
                >
                  <p className="text-xs font-medium text-white">{n.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </Link>
              ))
            )}
          </div>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-xs text-soc-accent hover:bg-white/[0.03] border-t border-white/[0.06]"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
