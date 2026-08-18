import { query } from '../../db/connection.js';

const inventorySelect = `
  SELECT i.id, i.product_id, i.location_id, i.quantity, i.low_stock_threshold,
         (i.quantity <= i.low_stock_threshold) AS is_low_stock,
         CASE
           WHEN i.quantity <= 0 THEN 'out_of_stock'
           WHEN i.quantity <= i.low_stock_threshold THEN 'limited_stock'
           ELSE 'available'
         END AS availability,
         i.created_at, i.updated_at,
         p.sku, p.name AS product_name, p.is_active AS product_is_active,
         l.code AS location_code, l.name AS location_name, l.type AS location_type,
         l.is_active AS location_is_active
  FROM inventory i
  INNER JOIN products p ON p.id = i.product_id
  INNER JOIN locations l ON l.id = i.location_id`;

export const listInventory = async ({ locationId = null, productId = null, search = '', lowStockOnly = false } = {}) => {
  let sql = `${inventorySelect} WHERE 1=1`;
  const params = [];
  if (locationId) { sql += ' AND i.location_id = ?'; params.push(locationId); }
  if (productId) { sql += ' AND i.product_id = ?'; params.push(productId); }
  if (search.trim()) {
    const pattern = `%${search.trim()}%`;
    sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
    params.push(pattern, pattern);
  }
  if (lowStockOnly) sql += ' AND i.quantity <= i.low_stock_threshold';
  sql += ' ORDER BY l.name ASC, p.name ASC';
  const [rows] = await query(sql, params);
  return rows;
};

export const findInventoryById = async (id) => {
  const [rows] = await query(`${inventorySelect} WHERE i.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

export const findByProductAndLocation = async (productId, locationId) => {
  const [rows] = await query(`${inventorySelect} WHERE i.product_id = ? AND i.location_id = ? LIMIT 1`, [productId, locationId]);
  return rows[0] || null;
};

export const ensureInventoryRow = async (connection, productId, locationId) => {
  await connection.execute(
    `INSERT INTO inventory (product_id, location_id, quantity, low_stock_threshold)
     VALUES (?, ?, 0, 0)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [productId, locationId]
  );
};

export const lockByProductAndLocation = async (connection, productId, locationId) => {
  const [rows] = await connection.execute(
    `SELECT id, product_id, location_id, quantity, low_stock_threshold, low_stock_alert_active
     FROM inventory WHERE product_id = ? AND location_id = ? FOR UPDATE`,
    [productId, locationId]
  );
  return rows[0] || null;
};

export const lockById = async (connection, id) => {
  const [rows] = await connection.execute(
    `SELECT id, product_id, location_id, quantity, low_stock_threshold, low_stock_alert_active
     FROM inventory WHERE id = ? FOR UPDATE`,
    [id]
  );
  return rows[0] || null;
};

export const updateQuantity = async (connection, inventoryId, quantity) => {
  await connection.execute('UPDATE inventory SET quantity = ? WHERE id = ?', [quantity, inventoryId]);
};

export const updateThreshold = async (inventoryId, threshold) => {
  await query('UPDATE inventory SET low_stock_threshold = ? WHERE id = ?', [threshold, inventoryId]);
};

export const updateThresholdInTransaction = async (connection, inventoryId, threshold) => {
  await connection.execute('UPDATE inventory SET low_stock_threshold = ? WHERE id = ?', [threshold, inventoryId]);
};

export default { listInventory, findInventoryById, findByProductAndLocation, ensureInventoryRow, lockByProductAndLocation, lockById, updateQuantity, updateThreshold, updateThresholdInTransaction };
