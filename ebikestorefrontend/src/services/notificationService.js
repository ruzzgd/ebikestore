import apiClient from './apiClient.js';

export async function getNotifications({ unreadOnly = false, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({ unreadOnly: String(unreadOnly), limit: String(limit), offset: String(offset) });
  const response = await apiClient(`/notifications?${params}`);
  return response.data?.notifications || [];
}
export async function getUnreadCount() {
  const response = await apiClient('/notifications/unread-count');
  return response.data?.unreadCount || 0;
}
export async function markRead(id) {
  await apiClient(`/notifications/${id}/read`, { method: 'PATCH' });
}
export async function markAllRead() {
  const response = await apiClient('/notifications/read-all', { method: 'PATCH' });
  return response.data?.updatedCount || 0;
}

export function getNotificationPath(notification) {
  if (notification.reference_type === 'inter_branch_request') return `/transfers/${notification.reference_id}`;
  if (notification.reference_type === 'customer_application') return `/applications/${notification.reference_id}`;
  if (notification.reference_type === 'inventory') return '/inventory';
  return '/notifications';
}

export default { getNotifications, getUnreadCount, markRead, markAllRead, getNotificationPath };
