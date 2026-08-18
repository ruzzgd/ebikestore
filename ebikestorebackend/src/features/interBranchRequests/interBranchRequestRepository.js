import { query } from '../../db/connection.js';

const requestSelect = `
  SELECT r.id, r.request_reference, r.source_location_id, r.destination_location_id,
         r.requested_by_user_id, r.approved_by_user_id, r.dispatched_by_user_id,
         r.received_by_user_id, r.rejected_by_user_id, r.status, r.note,
         r.requested_at, r.approved_at, r.dispatched_at, r.received_at, r.rejected_at,
         r.requested_delivery_date, r.reason_for_transfer, r.pending_reminder_sent_at,
         r.created_at, r.updated_at,
         source.code AS source_location_code, source.name AS source_location_name,
         source.type AS source_location_type, source.is_active AS source_location_is_active,
         destination.code AS destination_location_code, destination.name AS destination_location_name,
         destination.type AS destination_location_type, destination.is_active AS destination_location_is_active,
         requester.name AS requested_by_name,
         approver.name AS approved_by_name,
         dispatcher.name AS dispatched_by_name,
         receiver.name AS received_by_name,
         rejecter.name AS rejected_by_name,
         (SELECT COUNT(*) FROM inter_branch_request_items item_count WHERE item_count.request_id = r.id) AS item_count
  FROM inter_branch_requests r
  INNER JOIN locations source ON source.id = r.source_location_id
  INNER JOIN locations destination ON destination.id = r.destination_location_id
  INNER JOIN users requester ON requester.id = r.requested_by_user_id
  LEFT JOIN users approver ON approver.id = r.approved_by_user_id
  LEFT JOIN users dispatcher ON dispatcher.id = r.dispatched_by_user_id
  LEFT JOIN users receiver ON receiver.id = r.received_by_user_id
  LEFT JOIN users rejecter ON rejecter.id = r.rejected_by_user_id`;

export const createRequest = async (connection, data) => {
  const [result] = await connection.execute(
    `INSERT INTO inter_branch_requests
       (request_reference, source_location_id, destination_location_id, requested_by_user_id, status, note, requested_delivery_date, reason_for_transfer)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [data.requestReference, data.sourceLocationId, data.destinationLocationId, data.requestedByUserId, data.note || null, data.requestedDeliveryDate, data.reasonForTransfer || null]
  );
  return result.insertId;
};

export const createItems = async (connection, requestId, items) => {
  for (const item of items) {
    await connection.execute(
      `INSERT INTO inter_branch_request_items (request_id, product_id, quantity_requested)
       VALUES (?, ?, ?)`,
      [requestId, item.productId, item.quantityRequested]
    );
  }
};

export const listRequests = async ({ actorLocationId = null, status = null, sourceLocationId = null, destinationLocationId = null, limit = 100, offset = 0 } = {}) => {
  let sql = `${requestSelect} WHERE 1=1`;
  const params = [];
  if (actorLocationId) { sql += ' AND (r.source_location_id = ? OR r.destination_location_id = ?)'; params.push(actorLocationId, actorLocationId); }
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  if (sourceLocationId) { sql += ' AND r.source_location_id = ?'; params.push(sourceLocationId); }
  if (destinationLocationId) { sql += ' AND r.destination_location_id = ?'; params.push(destinationLocationId); }
  const safeLimit = Math.min(250, Math.max(1, Number.parseInt(limit, 10) || 100));
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
  sql += ` ORDER BY r.created_at DESC, r.id DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  const [rows] = await query(sql, params);
  return rows;
};

export const findRequestById = async (id) => {
  const [rows] = await query(`${requestSelect} WHERE r.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

export const findRequestByReference = async (reference) => {
  const [rows] = await query(`${requestSelect} WHERE r.request_reference = ? LIMIT 1`, [reference]);
  return rows[0] || null;
};

export const listItems = async (requestId) => {
  const [rows] = await query(
    `SELECT ri.id, ri.request_id, ri.product_id, ri.quantity_requested,
            ri.quantity_dispatched, ri.quantity_received, ri.created_at, ri.updated_at,
            p.sku, p.name AS product_name, p.is_active AS product_is_active
     FROM inter_branch_request_items ri
     INNER JOIN products p ON p.id = ri.product_id
     WHERE ri.request_id = ? ORDER BY p.name ASC`,
    [requestId]
  );
  return rows;
};

export const lockRequestById = async (connection, id) => {
  const [rows] = await connection.execute('SELECT * FROM inter_branch_requests WHERE id = ? FOR UPDATE', [id]);
  return rows[0] || null;
};

export const listItemsForUpdate = async (connection, requestId) => {
  const [rows] = await connection.execute(
    `SELECT ri.id, ri.request_id, ri.product_id, ri.quantity_requested,
            ri.quantity_dispatched, ri.quantity_received,
            p.sku, p.name AS product_name, p.is_active AS product_is_active
     FROM inter_branch_request_items ri
     INNER JOIN products p ON p.id = ri.product_id
     WHERE ri.request_id = ? ORDER BY ri.product_id ASC FOR UPDATE`,
    [requestId]
  );
  return rows;
};

export const lockLocations = async (connection, locationIds) => {
  const orderedIds = [...locationIds].sort((a, b) => a - b);
  const [rows] = await connection.execute(
    `SELECT id, code, name, type, is_active FROM locations WHERE id IN (?, ?) ORDER BY id ASC FOR UPDATE`,
    orderedIds
  );
  return rows;
};

export const updateStatus = async (connection, requestId, status, actorId) => {
  const fields = {
    approved: ['approved_by_user_id', 'approved_at'],
    rejected: ['rejected_by_user_id', 'rejected_at'],
    in_transit: ['dispatched_by_user_id', 'dispatched_at'],
    received: ['received_by_user_id', 'received_at'],
  };
  const [userField, timestampField] = fields[status];
  await connection.execute(
    `UPDATE inter_branch_requests SET status = ?, ${userField} = ?, ${timestampField} = CURRENT_TIMESTAMP WHERE id = ?`,
    [status, actorId, requestId]
  );
};

export const markItemDispatched = async (connection, itemId, quantity) => {
  await connection.execute('UPDATE inter_branch_request_items SET quantity_dispatched = ? WHERE id = ?', [quantity, itemId]);
};

export const markItemReceived = async (connection, itemId, quantity) => {
  await connection.execute('UPDATE inter_branch_request_items SET quantity_received = ? WHERE id = ?', [quantity, itemId]);
};

export default { createRequest, createItems, listRequests, findRequestById, findRequestByReference, listItems, lockRequestById, listItemsForUpdate, lockLocations, updateStatus, markItemDispatched, markItemReceived };
