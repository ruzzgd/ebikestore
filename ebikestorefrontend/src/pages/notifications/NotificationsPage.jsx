import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService.js';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { setNotifications(await notificationService.getNotifications({ limit: 100 })); }
    catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const markOne = async (notification, navigateAfter = false) => {
    try {
      if (!notification.is_read) await notificationService.markRead(notification.id);
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
      if (navigateAfter) navigate(notificationService.getNotificationPath(notification));
    } catch (markError) { setError(markError.message); }
  };
  const markAll = async () => {
    try { await notificationService.markAllRead(); setNotifications((items) => items.map((item) => ({ ...item, is_read: true }))); }
    catch (markError) { setError(markError.message); }
  };

  return <div>
    <div className="inventory-heading"><div><h1>Notifications</h1><p>Your persisted inventory and workflow alerts.</p></div><button className="btn-refresh" onClick={markAll}><CheckCheck size={16} /> Mark all read</button></div>
    {error && <div className="inventory-alert error">{error}</div>}
    {loading ? <div className="card">Loading notifications…</div> : notifications.length === 0 ? <div className="card notification-page-empty"><Bell size={45} /><h2>Nothing to show</h2><p>Workflow updates and relevant stock alerts will appear here.</p></div> : <div className="notification-list">{notifications.map((notification) => <article className={`card notification-row ${notification.is_read ? '' : 'unread'}`} key={notification.id}><div className="notification-row-icon"><Bell size={18} /></div><div><h3>{notification.title}</h3><p>{notification.message}</p><small>{new Date(notification.created_at).toLocaleString()}</small></div><div className="notification-row-actions">{!notification.is_read && <button className="btn-refresh" onClick={() => markOne(notification)}><Check size={14} /> Mark read</button>}<button className="btn-refresh primary" onClick={() => markOne(notification, true)}>Open</button></div></article>)}</div>}
  </div>;
}
export default NotificationsPage;
