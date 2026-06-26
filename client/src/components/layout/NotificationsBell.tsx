import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, type AppNotification } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { getNotificationDisplayText } from '../../utils/notificationText';

const POLL_INTERVAL_MS = 60_000;

function formatBadgeCount(count: number): string {
  if (count > 9) {
    return '9+';
  }
  return String(count);
}

function NotificationListItem({
  notification,
  display,
  onSelect,
}: Readonly<{
  notification: AppNotification;
  display: { title: string; body: string };
  onSelect: (notification: AppNotification) => void;
}>) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(notification)}
        className={`w-full text-left px-4 py-3 transition-colors hover:bg-cyber-panel/70 ${
          notification.isRead ? 'opacity-80' : 'bg-cyber-primary/5'
        }`}
      >
        <div className="flex items-start gap-2">
          {!notification.isRead && (
            <span className="mt-1.5 w-2 h-2 rounded-full bg-cyber-primary shrink-0" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <div
              className={`text-sm truncate ${
                notification.isRead ? 'text-gray-300' : 'text-gray-100 font-medium'
              }`}
            >
              {display.title}
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{display.body}</p>
            <div className="text-[11px] text-gray-600 mt-2">
              {new Date(notification.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </button>
    </li>
  );
}

export default function NotificationsBell() {
  const { t, i18n } = useTranslation(['ui']);
  const isEn = i18n.resolvedLanguage?.startsWith('en') ?? false;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const [items, unread] = await Promise.all([
        api.getNotifications(),
        api.getNotificationUnreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(unread.count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshNotifications().catch(() => {
      // refreshNotifications already logs errors
    });
  }, [refreshNotifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const intervalId = globalThis.setInterval(() => {
      refreshNotifications().catch(() => {
        // refreshNotifications already logs errors
      });
    }, POLL_INTERVAL_MS);

    return () => globalThis.clearInterval(intervalId);
  }, [isAuthenticated, refreshNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = async () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);

    if (nextOpen) {
      setLoading(true);
      try {
        await refreshNotifications();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    setIsOpen(false);

    if (!notification.isRead) {
      try {
        await api.markNotificationRead(notification.id);
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await api.markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const renderNotificationsContent = () => {
    if (loading) {
      return (
        <div className="px-4 py-6 text-center text-sm text-gray-500">
          {t('loading', { ns: 'ui', defaultValue: isEn ? 'Loading...' : 'Завантаження...' })}
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="px-4 py-6 text-center text-sm text-gray-500">
          {t('notificationsEmpty', {
            ns: 'ui',
            defaultValue: isEn ? 'No notifications yet.' : 'Сповіщень поки немає.',
          })}
        </div>
      );
    }

    return (
      <ul className="max-h-80 overflow-y-auto divide-y divide-cyber-border/60">
        {notifications.map((notification) => (
          <NotificationListItem
            key={notification.id}
            notification={notification}
            display={getNotificationDisplayText(notification, t, isEn)}
            onSelect={handleNotificationClick}
          />
        ))}
      </ul>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => void handleToggle()}
        className="relative w-10 h-10 flex items-center justify-center rounded-lg border border-cyber-border text-gray-300 hover:border-cyber-primary hover:text-cyber-primary transition-colors"
        aria-label={t('notificationsOpen', {
          ns: 'ui',
          defaultValue: isEn ? 'Open notifications' : 'Відкрити сповіщення',
        })}
        aria-expanded={isOpen}
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-cyber-primary text-cyber-background text-[10px] font-bold leading-none flex items-center justify-center">
            {formatBadgeCount(unreadCount)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-cyber-panel border border-cyber-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-cyber-border">
            <h2 className="font-heading text-sm text-cyber-primary">
              {t('notificationsTitle', {
                ns: 'ui',
                defaultValue: isEn ? 'Notifications' : 'Сповіщення',
              })}
            </h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="text-xs text-cyber-primary hover:underline shrink-0"
              >
                {t('notificationsMarkAllRead', {
                  ns: 'ui',
                  defaultValue: isEn ? 'Mark all read' : 'Позначити всі',
                })}
              </button>
            )}
          </div>

          {renderNotificationsContent()}
        </div>
      )}
    </div>
  );
}
