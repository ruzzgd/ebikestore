import { query } from '../../db/connection.js';

export const createNotification = async (connection, notification) => {
  const [result] = await connection.execute(
    `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [notification.userId, notification.type, notification.title, notification.message,
      notification.referenceType || null, notification.referenceId || null]
  );
  return result.insertId;
};

export const createMany = async (connection, userIds, notification) => {
  const uniqueUserIds = [...new Set(userIds.map(Number).filter(Boolean))];
  for (const userId of uniqueUserIds) await createNotification(connection, { ...notification, userId });
};

export const listForUser = async (userId, { unreadOnly = false, limit = 50, offset = 0 } = {}) => {
  let sql = `SELECT id, user_id, type, title, message, reference_type, reference_id, is_read, created_at, read_at
             FROM notifications WHERE user_id = ?`;
  const params = [userId];
  if (unreadOnly) sql += ' AND is_read = false';
  const safeLimit = Math.min(200, Math.max(1, Number.parseInt(limit, 10) || 50));
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
  sql += ` ORDER BY created_at DESC, id DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  const [rows] = await query(sql, params);
  return rows;
};

export const countUnread = async (userId) => {
  const [rows] = await query('SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = false', [userId]);
  return Number(rows[0].unread_count);
};

export const markRead = async (userId, notificationId) => {
  const [result] = await query(
    `UPDATE notifications SET is_read = true, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
  return result.affectedRows;
};

export const markAllRead = async (userId) => {
  const [result] = await query(
    `UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND is_read = false`,
    [userId]
  );
  return result.affectedRows;
};

export const findActiveAdminIds = async (connection) => {
  const [rows] = await connection.execute("SELECT id FROM users WHERE role = 'admin' AND is_active = true");
  return rows.map((row) => row.id);
};

export const findActiveStaffIdsAtLocation = async (connection, locationId) => {
  const [rows] = await connection.execute(
    `SELECT id FROM users
     WHERE location_id = ? AND role IN ('branch_staff', 'warehouse_staff') AND is_active = true`,
    [locationId]
  );
  return rows.map((row) => row.id);
};

export const findInventoryContext = async (connection, inventoryId) => {
  const [rows] = await connection.execute(
    `SELECT i.id, i.quantity, i.low_stock_threshold, i.low_stock_alert_active,
            p.name AS product_name, l.id AS location_id, l.name AS location_name
     FROM inventory i
     INNER JOIN products p ON p.id = i.product_id
     INNER JOIN locations l ON l.id = i.location_id
     WHERE i.id = ? LIMIT 1`,
    [inventoryId]
  );
  return rows[0] || null;
};

export const setInventoryAlertActive = async (connection, inventoryId, isActive) => {
  await connection.execute('UPDATE inventory SET low_stock_alert_active = ? WHERE id = ?', [isActive, inventoryId]);
};

export default { createNotification, createMany, listForUser, countUnread, markRead, markAllRead, findActiveAdminIds, findActiveStaffIdsAtLocation, findInventoryContext, setInventoryAlertActive };
