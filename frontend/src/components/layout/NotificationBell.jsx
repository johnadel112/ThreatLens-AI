import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from '../../api/notifications';
import { usePolling } from '../../hooks/usePolling';
import NotificationItem from './NotificationItem';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const buttonRef = useRef(null);

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
    if (!open) return undefined;

    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  async function handleMarkRead(id) {
    await markNotificationRead(id);
    await fetchNotifications();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    await fetchNotifications();
  }

  const panel = open ? createPortal(
    <>
      <button
        type="button"
        aria-label="Close notifications"
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
      />

      <div className="fixed top-14 right-4 sm:right-6 z-[100] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#0a0e14] shadow-2xl shadow-black/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-soc-accent" />
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-soc-critical/20 text-red-300 border border-red-500/20">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-soc-accent hover:text-soc-accent/80 font-medium"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/[0.06]"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-600 mt-1">Case and playbook alerts will appear here</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                compact
                onNavigate={() => setOpen(false)}
                onMarkRead={handleMarkRead}
              />
            ))
          )}
        </div>

        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="block px-4 py-3 text-center text-xs font-medium text-soc-accent hover:bg-white/[0.04] border-t border-white/[0.08] bg-white/[0.02]"
        >
          View all notifications
        </Link>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-lg transition-colors ${
          open
            ? 'text-soc-accent bg-soc-accent/10'
            : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
        }`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-soc-critical text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-[#0a0e14]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {panel}
    </>
  );
}
