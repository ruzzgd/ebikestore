import asyncHandler from '../../middleware/asyncHandler.js';
import notificationService from './notificationService.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listNotifications(req.user, {
    unreadOnly: req.query.unreadOnly === 'true', limit: req.query.limit, offset: req.query.offset,
  });
  res.status(200).json({ status: 'success', data: { notifications } });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user);
  res.status(200).json({ status: 'success', data: { unreadCount: count } });
});

export const markRead = asyncHandler(async (req, res) => {
  await notificationService.markNotificationRead(req.user, req.params.id);
  res.status(200).json({ status: 'success', message: 'Notification marked as read' });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const updatedCount = await notificationService.markAllNotificationsRead(req.user);
  res.status(200).json({ status: 'success', data: { updatedCount } });
});

export default { listNotifications, unreadCount, markRead, markAllRead };
