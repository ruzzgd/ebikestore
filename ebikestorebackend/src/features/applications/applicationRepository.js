import { query } from '../../db/connection.js';
import { encrypt, decrypt } from '../../utils/encryption.js';

const applicationSelect = `
  SELECT a.id, a.application_reference, a.customer_user_id, a.product_id, a.location_id,
         a.status, a.quantity, a.customer_name, a.contact_number, a.address, a.purpose,
         a.notes, a.rejection_reason, a.reviewed_by_user_id, a.reviewed_at,
         a.completed_by_user_id, a.completed_at, a.cancelled_at, a.created_at, a.updated_at,
         a.birth_date, a.id_type, a.id_number, a.id_expiration_date, a.uses_barangay_clearance,
         a.barangay_clearance_reference, a.renewal_receipt_present, a.guardian_name,
         a.guardian_id_type, a.guardian_id_number,
         p.sku, p.name AS product_name, p.image_key, p.is_active AS product_is_active,
         l.code AS location_code, l.name AS location_name, l.type AS location_type,
         l.is_active AS location_is_active,
         customer.name AS account_name, customer.email AS customer_email,
         reviewer.name AS reviewed_by_name, completer.name AS completed_by_name
  FROM customer_applications a
  INNER JOIN products p ON p.id = a.product_id
  INNER JOIN locations l ON l.id = a.location_id
  INNER JOIN users customer ON customer.id = a.customer_user_id
  LEFT JOIN users reviewer ON reviewer.id = a.reviewed_by_user_id
  LEFT JOIN users completer ON completer.id = a.completed_by_user_id`;

const mapRow = (row) => {
  if (!row) return row;
  return {
    ...row,
    customer_name: decrypt(row.customer_name),
    contact_number: decrypt(row.contact_number),
    address: decrypt(row.address),
    id_number: decrypt(row.id_number),
    guardian_id_number: decrypt(row.guardian_id_number)
  };
};

export const createApplication = async (connection, data) => {
  const [result] = await connection.execute(
    `INSERT INTO customer_applications
       (application_reference, customer_user_id, product_id, location_id, status, quantity,
        customer_name, contact_number, address, purpose, notes, birth_date, id_type,
        id_number, id_expiration_date, uses_barangay_clearance, barangay_clearance_reference,
        renewal_receipt_present, guardian_name, guardian_id_type, guardian_id_number)
     VALUES (?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.applicationReference, data.customerUserId, data.productId, data.locationId,
      data.quantity, encrypt(data.customerName), encrypt(data.contactNumber),
      encrypt(data.address), data.purpose, data.notes || null, data.birthDate,
      data.idType, encrypt(data.idNumber), data.idExpirationDate,
      data.usesBarangayClearance, data.barangayClearanceReference || null,
      data.renewalReceiptPresent, data.guardianName || null,
      data.guardianIdType || null, encrypt(data.guardianIdNumber)
    ]
  );
  return result.insertId;
};

export const findById = async (id) => {
  const [rows] = await query(`${applicationSelect} WHERE a.id = ? LIMIT 1`, [id]);
  return mapRow(rows[0] || null);
};

export const findByReference = async (reference) => {
  const [rows] = await query(`${applicationSelect} WHERE a.application_reference = ? LIMIT 1`, [reference]);
  return mapRow(rows[0] || null);
};

export const listApplications = async ({ customerUserId = null, locationId = null, status = null, dateFrom = null, dateTo = null, limit = 100, offset = 0 } = {}) => {
  let sql = `${applicationSelect} WHERE 1=1`;
  const params = [];
  if (customerUserId) { sql += ' AND a.customer_user_id = ?'; params.push(customerUserId); }
  if (locationId) { sql += ' AND a.location_id = ?'; params.push(locationId); }
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  if (dateFrom) { sql += ' AND a.created_at >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND a.created_at <= ?'; params.push(dateTo); }
  const safeLimit = Math.min(250, Math.max(1, Number.parseInt(limit, 10) || 100));
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
  sql += ` ORDER BY a.created_at DESC, a.id DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  const [rows] = await query(sql, params);
  return rows.map(mapRow);
};

export const lockApplication = async (connection, id) => {
  const [rows] = await connection.execute('SELECT * FROM customer_applications WHERE id = ? FOR UPDATE', [id]);
  return rows[0] || null;
};

export const lockProduct = async (connection, productId) => {
  const [rows] = await connection.execute('SELECT id, name, sku, is_active FROM products WHERE id = ? FOR UPDATE', [productId]);
  return rows[0] || null;
};

export const lockLocation = async (connection, locationId) => {
  const [rows] = await connection.execute('SELECT id, name, type, is_active FROM locations WHERE id = ? FOR UPDATE', [locationId]);
  return rows[0] || null;
};

export const setStatus = async (connection, id, status, { actorId = null, rejectionReason = null } = {}) => {
  if (status === 'under_review' || status === 'approved' || status === 'rejected') {
    await connection.execute(
      `UPDATE customer_applications
       SET status = ?, reviewed_by_user_id = ?, reviewed_at = CURRENT_TIMESTAMP,
           rejection_reason = ? WHERE id = ?`,
      [status, actorId, status === 'rejected' ? rejectionReason : null, id]
    );
    return;
  }
  if (status === 'cancelled') {
    await connection.execute("UPDATE customer_applications SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    return;
  }
  if (status === 'completed') {
    await connection.execute(
      "UPDATE customer_applications SET status = 'completed', completed_by_user_id = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?",
      [actorId, id]
    );
  }
};

export default { createApplication, findById, findByReference, listApplications, lockApplication, lockProduct, lockLocation, setStatus };
