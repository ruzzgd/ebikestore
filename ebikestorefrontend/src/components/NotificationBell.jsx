import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService.js';

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [count, recent] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getNotifications({ limit: 5 }),
      ]);
      setUnreadCount(count);
      setNotifications(recent);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  const openNotification = async (notification) => {
    if (!notification.is_read) {
      try {
        await notificationService.markRead(notification.id);
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (markError) {
        setError(markError.message);
        return;
      }
    }
    setOpen(false);
    navigate(notificationService.getNotificationPath(notification));
  };

  const deleteOne = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((items) => items.filter((item) => item.id !== notificationId));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (delError) {
      setError(delError.message);
    }
  };

  return (
    <div className="notification-bell-wrap">
      <button className="notification-bell" onClick={() => setOpen(!open)} aria-label="Notifications">
        <Bell size={19} />
        {unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <strong>Notifications</strong>
            <button
              onClick={async () => {
                await notificationService.markAllRead();
                setUnreadCount(0);
                setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
              }}
            >
              <CheckCheck size={15} /> Read all
            </button>
          </div>
          {error ? (
            <p className="notification-error">{error}</p>
          ) : notifications.length === 0 ? (
            <p className="notification-empty">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <div
                className={`notification-preview ${notification.is_read ? '' : 'unread'}`}
                key={notification.id}
                onClick={() => openNotification(notification)}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong>{notification.title}</strong>
                  <button
                    type="button"
                    onClick={(e) => deleteOne(e, notification.id)}
                    title="Delete notification"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '2px',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <span>{notification.message}</span>
                <small>{new Date(notification.created_at).toLocaleString()}</small>
              </div>
            ))
          )}
          <Link to="/notifications" onClick={() => setOpen(false)} className="notification-view-all">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
