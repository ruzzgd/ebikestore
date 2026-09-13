import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, CheckCircle, ExternalLink, Package, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import notificationService from '../services/notificationService.js';

export function NotificationAlertPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeAlert, setActiveAlert] = useState(null);
  const seenIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);
  const timerRef = useRef(null);

  const showAlert = (notification) => {
    setActiveAlert(notification);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActiveAlert(null);
    }, 7000);
  };

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveAlert(null);
  };

  const handleOpen = async (notification) => {
    dismiss();
    try {
      if (!notification.is_read) {
        await notificationService.markRead(notification.id);
      }
    } catch {
      // Ignore background mark read error on navigate
    }
    navigate(notificationService.getNotificationPath(notification));
  };

  useEffect(() => {
    if (!user) {
      setActiveAlert(null);
      seenIdsRef.current.clear();
      initialLoadRef.current = true;
      return;
    }

    let isSubscribed = true;

    const pollNotifications = async () => {
      try {
        const notifications = await notificationService.getNotifications({ limit: 10 });
        if (!isSubscribed) return;

        if (initialLoadRef.current) {
          // On first load, seed seen IDs with all existing read notifications
          // If there are unread notifications, pop the most recent urgent one
          notifications.forEach((n) => {
            if (n.is_read) seenIdsRef.current.add(n.id);
          });

          const unread = notifications.filter((n) => !n.is_read);
          if (unread.length > 0) {
            const firstUnread = unread[0];
            seenIdsRef.current.add(firstUnread.id);
            showAlert(firstUnread);
          }
          initialLoadRef.current = false;
          return;
        }

        // Subsequent polls: look for any notifications we haven't popped yet
        const unseen = notifications.filter((n) => !seenIdsRef.current.has(n.id) && !n.is_read);
        if (unseen.length > 0) {
          const newest = unseen[0];
          unseen.forEach((n) => seenIdsRef.current.add(n.id));
          showAlert(newest);
        }
      } catch {
        // Silently tolerate transient network poll failure
      }
    };

    pollNotifications();
    const interval = setInterval(pollNotifications, 15000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user]);

  if (!activeAlert) return null;

  const isLowStock = activeAlert.type === 'low_stock';
  const isTransfer = activeAlert.type?.startsWith('transfer');

  return (
    <aside
      className="notification-pop-alert"
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onMouseLeave={() => {
        timerRef.current = setTimeout(() => setActiveAlert(null), 4000);
      }}
    >
      <div className="notification-pop-alert-header">
        <div className="notification-pop-alert-badge">
          {isLowStock ? (
            <AlertTriangle size={15} color="#dc2626" />
          ) : isTransfer ? (
            <Package size={15} color="#2563eb" />
          ) : (
            <Bell size={15} color="#0d9488" />
          )}
          <span>{isLowStock ? 'Stock Alert' : 'Notification'}</span>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close alert"
          className="notification-pop-close"
        >
          <X size={14} />
        </button>
      </div>

      <div className="notification-pop-alert-content">
        <h4>{activeAlert.title}</h4>
        <p>{activeAlert.message}</p>
        <small>{new Date(activeAlert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
      </div>

      <div className="notification-pop-alert-actions">
        <button
          type="button"
          className="btn-refresh primary"
          onClick={() => handleOpen(activeAlert)}
          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', minHeight: '30px' }}
        >
          <span>View Details</span>
          <ExternalLink size={13} />
        </button>
        <button
          type="button"
          className="btn-refresh"
          onClick={dismiss}
          style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', minHeight: '30px' }}
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}

export default NotificationAlertPopup;
