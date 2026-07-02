import { Link } from 'react-router-dom';
import { getNotificationConfig, formatNotificationTime } from '../../utils/notificationUtils';

export default function NotificationItem({
  notification,
  compact = false,
  onNavigate,
  onMarkRead,
}) {
  const config = getNotificationConfig(notification.type);
  const Icon = config.icon;

  const content = (
    <div
      className={`flex gap-3 ${compact ? 'px-4 py-3' : 'p-4'} ${
        !notification.read ? 'bg-soc-accent/[0.04]' : ''
      }`}
    >
      <div
        className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${config.bg} ${config.border}`}
      >
        <Icon className={`w-4 h-4 ${config.accent}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${config.accent}`}>
                {config.label}
              </span>
              {!notification.read && (
                <span className="w-1.5 h-1.5 rounded-full bg-soc-accent shrink-0" aria-hidden />
              )}
            </div>
            <p className={`font-medium text-white leading-snug ${compact ? 'text-xs' : 'text-sm'}`}>
              {notification.title}
            </p>
          </div>
          <span className="text-[10px] text-gray-600 whitespace-nowrap shrink-0">
            {formatNotificationTime(notification.createdAt)}
          </span>
        </div>

        <p className={`text-gray-500 mt-1 leading-relaxed ${compact ? 'text-[11px] line-clamp-2' : 'text-sm'}`}>
          {notification.message}
        </p>

        {!compact && (
          <div className="flex items-center gap-3 mt-3">
            {notification.link && (
              <span className="text-xs text-soc-accent">View details →</span>
            )}
            {!notification.read && onMarkRead && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                className="text-xs text-gray-500 hover:text-white"
              >
                Mark read
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link
        to={notification.link}
        onClick={() => {
          if (!notification.read && onMarkRead) onMarkRead(notification.id);
          onNavigate?.();
        }}
        className={`block border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors ${
          !notification.read ? 'border-l-2 border-l-soc-accent' : 'border-l-2 border-l-transparent'
        }`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={`border-b border-white/[0.05] ${
        !notification.read ? 'border-l-2 border-l-soc-accent' : 'border-l-2 border-l-transparent'
      }`}
    >
      {content}
    </div>
  );
}
