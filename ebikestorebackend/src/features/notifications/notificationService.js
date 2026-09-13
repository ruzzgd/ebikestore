import notificationRepository from './notificationRepository.js';
import userRepository from '../users/userRepository.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';

export const NOTIFICATION_TYPES = Object.freeze([
  'low_stock', 'transfer_requested', 'transfer_approved', 'transfer_rejected',
  'transfer_dispatched', 'transfer_received', 'application_submitted',
  'application_under_review', 'application_approved', 'application_rejected',
  'application_completed', 'application_cancelled',
]);

const getActor = async (authUser) => {
  const actor = await userRepository.findUserById(authUser.userId);
  if (!actor || !actor.is_active) throw new UnauthorizedError('Active user account required');
  return actor;
};

const parseId = (value, name) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new BadRequestError(`${name} must be a positive integer`);
  return parsed;
};

export const createForUsers = async (connection, userIds, notification) => {
  if (!NOTIFICATION_TYPES.includes(notification.type)) throw new Error(`Unsupported notification type '${notification.type}'`);
  await notificationRepository.createMany(connection, userIds, notification);
};

export const getAdminIds = (connection) => notificationRepository.findActiveAdminIds(connection);
export const getLocationStaffIds = (connection, locationId) => notificationRepository.findActiveStaffIdsAtLocation(connection, locationId);

export const getRecipientsForLocation = async (connection, locationId, { includeAdmins = false } = {}) => {
  const staffIds = await getLocationStaffIds(connection, locationId);
  if (!includeAdmins) return staffIds;
  return [...new Set([...staffIds, ...(await getAdminIds(connection))])];
};

export const listNotifications = async (authUser, options = {}) => {
  const actor = await getActor(authUser);
  return notificationRepository.listForUser(actor.id, options);
};

export const getUnreadCount = async (authUser) => {
  const actor = await getActor(authUser);
  return notificationRepository.countUnread(actor.id);
};

export const markNotificationRead = async (authUser, notificationIdValue) => {
  const actor = await getActor(authUser);
  const affected = await notificationRepository.markRead(actor.id, parseId(notificationIdValue, 'notificationId'));
  if (!affected) throw new NotFoundError('Notification not found');
};

export const markAllNotificationsRead = async (authUser) => {
  const actor = await getActor(authUser);
  return notificationRepository.markAllRead(actor.id);
};

export const deleteNotification = async (authUser, notificationIdValue) => {
  const actor = await getActor(authUser);
  const affected = await notificationRepository.deleteNotification(actor.id, parseId(notificationIdValue, 'notificationId'));
  if (!affected) throw new NotFoundError('Notification not found');
};

export const deleteAllReadNotifications = async (authUser) => {
  const actor = await getActor(authUser);
  return notificationRepository.deleteAllRead(actor.id);
};

export const shouldActivateLowStockAlert = ({ alertActive, quantityAfter, threshold }) => !alertActive && quantityAfter <= threshold;
export const shouldClearLowStockAlert = ({ alertActive, quantityAfter, threshold }) => alertActive && quantityAfter > threshold;

export const syncLowStockAlert = async (connection, inventoryId, quantityAfter) => {
  const context = await notificationRepository.findInventoryContext(connection, inventoryId);
  if (!context) return;
  const state = { alertActive: Boolean(context.low_stock_alert_active), quantityAfter, threshold: Number(context.low_stock_threshold) };
  if (shouldActivateLowStockAlert(state)) {
    await notificationRepository.setInventoryAlertActive(connection, inventoryId, true);
    const recipients = await getRecipientsForLocation(connection, context.location_id, { includeAdmins: true });
    await createForUsers(connection, recipients, {
      type: 'low_stock', title: 'Low stock alert',
      message: `${context.product_name} at ${context.location_name} is at or below its low-stock threshold.`,
      referenceType: 'inventory', referenceId: String(inventoryId),
    });
  } else if (shouldClearLowStockAlert(state)) {
    await notificationRepository.setInventoryAlertActive(connection, inventoryId, false);
  }
};

export default { createForUsers, getAdminIds, getLocationStaffIds, getRecipientsForLocation, listNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, deleteNotification, deleteAllReadNotifications, syncLowStockAlert };
