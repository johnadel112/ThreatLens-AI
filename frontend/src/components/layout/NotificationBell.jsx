import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from '../../api/notifications';
import { usePolling } from '../../hooks/usePolling';
import { useIsMobile } from '../../hooks/useIsMobile';

import NotificationItem from './NotificationItem';

export default function NotificationBell() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const [listData, countData] = await Promise.all([
        getNotifications({ limit: 12 }),
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

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = prevOverflow;
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

  const drawer = createPortal(
    <div
      className={`fixed inset-0 z-[200] transition-opacity duration-200 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close notifications"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <aside
        role="dialog"
        aria-label="Notifications"
        className={`absolute bg-[#080b10] shadow-2xl shadow-black/50 overflow-hidden transition-transform duration-300 ease-out ${
          isMobile
            ? `bottom-0 inset-x-0 rounded-t-2xl border-t border-white/10 max-h-[85vh] flex flex-col ${open ? 'translate-y-0' : 'translate-y-full'}`
            : `top-0 right-0 h-full w-full max-w-md border-l border-white/10 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-gradient-to-r from-soc-accent/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-soc-accent/15 border border-soc-accent/25 flex items-center justify-center">
              <Bell className="w-4 h-4 text-soc-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-[11px] text-gray-500">SOC activity feed</p>
            </div>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-soc-critical/20 text-red-300 border border-red-500/25">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {unreadCount > 0 && (
          <div className="px-5 py-2 border-b border-white/[0.06] bg-white/[0.02]">
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-soc-accent hover:text-soc-accent/80"
            >
              Mark all as read
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-400">All caught up</p>
              <p className="text-xs text-gray-600 mt-1 max-w-[220px]">
                New cases, playbook approvals, and assignments will show here.
              </p>
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

        <div className="p-4 border-t border-white/[0.08] bg-[#06080c]">
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block w-full py-2.5 text-center text-sm font-medium rounded-xl border border-soc-accent/30 text-soc-accent hover:bg-soc-accent/10 transition-colors"
          >
            Open notification center
          </Link>
        </div>
      </aside>
    </div>,
    document.body
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-soc-critical text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-[#080b10]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {drawer}
    </>
  );
}
