import { query } from '../../db/connection.js';

export const createMovement = async (connection, movement) => {
  const [result] = await connection.execute(
    `INSERT INTO stock_movements
       (product_id, location_id, type, quantity, quantity_before, quantity_after,
        reference_type, reference_id, note, performed_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [movement.productId, movement.locationId, movement.type, movement.quantity,
      movement.quantityBefore, movement.quantityAfter, movement.referenceType || null,
      movement.referenceId || null, movement.note || null, movement.performedByUserId]
  );
  return result.insertId;
};

export const listMovements = async ({ locationId = null, productId = null, type = null, userId = null, dateFrom = null, dateTo = null, limit = 100, offset = 0 } = {}) => {
  let sql = `
    SELECT sm.id, sm.product_id, sm.location_id, sm.type, sm.quantity,
           sm.quantity_before, sm.quantity_after, sm.reference_type, sm.reference_id,
           sm.note, sm.performed_by_user_id, sm.created_at,
           p.sku, p.name AS product_name,
           l.code AS location_code, l.name AS location_name, l.type AS location_type,
           u.name AS performed_by_name,
           request.request_reference,
           application.application_reference
    FROM stock_movements sm
    INNER JOIN products p ON p.id = sm.product_id
    INNER JOIN locations l ON l.id = sm.location_id
    INNER JOIN users u ON u.id = sm.performed_by_user_id
    LEFT JOIN inter_branch_requests request
      ON sm.reference_type = 'inter_branch_request' AND sm.reference_id = CAST(request.id AS CHAR)
    LEFT JOIN customer_applications application
      ON sm.reference_type = 'customer_application' AND sm.reference_id = CAST(application.id AS CHAR)
    WHERE 1=1`;
  const params = [];
  if (locationId) { sql += ' AND sm.location_id = ?'; params.push(locationId); }
  if (productId) { sql += ' AND sm.product_id = ?'; params.push(productId); }
  if (type) { sql += ' AND sm.type = ?'; params.push(type); }
  if (userId) { sql += ' AND sm.performed_by_user_id = ?'; params.push(userId); }
  if (dateFrom) { sql += ' AND sm.created_at >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND sm.created_at <= ?'; params.push(dateTo); }
  const safeLimit = Math.min(250, Math.max(1, Number.parseInt(limit, 10) || 100));
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
  sql += ` ORDER BY sm.created_at DESC, sm.id DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  const [rows] = await query(sql, params);
  return rows;
};

export default { createMovement, listMovements };
