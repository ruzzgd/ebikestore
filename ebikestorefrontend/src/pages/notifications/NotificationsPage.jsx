import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService.js';
import Pagination from '../../components/Pagination.jsx';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const PAGE_SIZE = 10;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setNotifications(await notificationService.getNotifications({ limit: 100 }));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markOne = async (notification, navigateAfter = false) => {
    try {
      if (!notification.is_read) {
        await notificationService.markRead(notification.id);
      }
      setNotifications((items) =>
        items.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
      );
      if (navigateAfter) navigate(notificationService.getNotificationPath(notification));
    } catch (markError) {
      setError(markError.message);
    }
  };

  const markAll = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    } catch (markError) {
      setError(markError.message);
    }
  };

  const deleteOne = async (notification) => {
    try {
      await notificationService.deleteNotification(notification.id);
      setNotifications((items) => items.filter((item) => item.id !== notification.id));
      if (selectedNotification?.id === notification.id) {
        setSelectedNotification(null);
      }
    } catch (delError) {
      setError(delError.message);
    }
  };

  const deleteAllRead = async () => {
    try {
      await notificationService.deleteAllRead();
      setNotifications((items) => items.filter((item) => !item.is_read));
    } catch (delError) {
      setError(delError.message);
    }
  };

  const paginatedNotifications = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return notifications.slice(start, start + PAGE_SIZE);
  }, [notifications, page]);

  return (
    <div>
      <div className="inventory-heading">
        <div>
          <h1>Notifications</h1>
          <p>Your persisted inventory and workflow alerts.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {notifications.some((n) => n.is_read) && (
            <button className="btn-refresh" onClick={deleteAllRead} title="Delete all read notifications">
              <Trash2 size={16} /> Delete all read
            </button>
          )}
          {notifications.some((n) => !n.is_read) && (
            <button className="btn-refresh" onClick={markAll}>
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {error && <div className="inventory-alert error">{error}</div>}

      {loading ? (
        <div className="card">Loading notifications…</div>
      ) : notifications.length === 0 ? (
        <div className="card notification-page-empty">
          <Bell size={45} />
          <h2>Nothing to show</h2>
          <p>Workflow updates and relevant stock alerts will appear here.</p>
        </div>
      ) : (
        <>
          <div className="notification-list">
            {paginatedNotifications.map((notification) => (
              <article
                className={`card notification-row ${notification.is_read ? '' : 'unread'}`}
                key={notification.id}
              >
                <div className="notification-row-icon">
                  <Bell size={18} />
                </div>
                <div style={{ cursor: 'pointer' }} onClick={() => setSelectedNotification(notification)}>
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  <small>{new Date(notification.created_at).toLocaleString()}</small>
                </div>
                <div className="notification-row-actions">
                  {!notification.is_read && (
                    <button
                      className="btn-refresh"
                      onClick={() => markOne(notification)}
                      title="Mark as read"
                    >
                      <Check size={14} /> Mark read
                    </button>
                  )}
                  <button
                    className="btn-refresh primary"
                    onClick={() => markOne(notification, true)}
                    title="Open destination"
                  >
                    Open
                  </button>
                  <button
                    className="btn-refresh destructive"
                    onClick={() => deleteOne(notification)}
                    title="Delete notification"
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalItems={notifications.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Pop Alert Detail Modal */}
      {selectedNotification && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedNotification(null);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              padding: '1.5rem',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(37,99,235,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                  }}
                >
                  <Bell size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                  {selectedNotification.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1rem' }}>
              {selectedNotification.message}
            </p>

            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              Received: {new Date(selectedNotification.created_at).toLocaleString()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-refresh"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => deleteOne(selectedNotification)}
              >
                <Trash2 size={14} /> Delete
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-refresh"
                  onClick={() => setSelectedNotification(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-refresh primary"
                  onClick={() => markOne(selectedNotification, true)}
                >
                  <span>Go to destination</span>
                  <ExternalLink size={13} style={{ marginLeft: '4px' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
