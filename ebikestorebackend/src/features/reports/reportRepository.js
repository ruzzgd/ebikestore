import { getPool } from '../../db/connection.js';

const getOverviewStats = async ({ locationId, startDate, endDate }) => {
  const pool = getPool();
  
  // Create an array of promises for concurrent execution
  const promises = [];

  // Active products
  promises.push(pool.query('SELECT COUNT(*) as count FROM products WHERE is_active = true').then(([rows]) => ({ activeProducts: Number(rows[0].count) })));

  // Inventory stats
  const invQuery = `
    SELECT 
      IFNULL(SUM(quantity), 0) as totalInventoryUnits,
      COUNT(CASE WHEN quantity <= low_stock_threshold THEN 1 END) as lowStockCount,
      COUNT(CASE WHEN quantity = 0 THEN 1 END) as outOfStockCount
    FROM inventory 
    WHERE (? IS NULL OR location_id = ?)
  `;
  promises.push(pool.query(invQuery, [locationId, locationId]).then(([rows]) => ({
    totalInventoryUnits: Number(rows[0].totalInventoryUnits),
    lowStockCount: Number(rows[0].lowStockCount),
    outOfStockCount: Number(rows[0].outOfStockCount),
  })));

  // Stock movements within period
  const movementQuery = `
    SELECT 
      IFNULL(SUM(CASE WHEN type = 'stock_in' THEN quantity ELSE 0 END), 0) as stockInUnits,
      IFNULL(SUM(CASE WHEN type IN ('stock_out', 'walk_in_sale') THEN quantity ELSE 0 END), 0) as stockOutUnits,
      IFNULL(SUM(CASE WHEN type = 'transfer_in' THEN quantity ELSE 0 END), 0) as transferInUnits,
      IFNULL(SUM(CASE WHEN type = 'transfer_out' THEN quantity ELSE 0 END), 0) as transferOutUnits
    FROM stock_movements
    WHERE (? IS NULL OR location_id = ?)
      AND created_at BETWEEN ? AND ?
  `;
  promises.push(pool.query(movementQuery, [locationId, locationId, startDate, endDate]).then(([rows]) => ({
    stockInUnits: Number(rows[0].stockInUnits),
    stockOutUnits: Number(rows[0].stockOutUnits),
    transferInUnits: Number(rows[0].transferInUnits),
    transferOutUnits: Number(rows[0].transferOutUnits),
  })));

  // Completed transactions (customer applications)
  const appQuery = `
    SELECT COUNT(*) as completedTransactions
    FROM customer_applications
    WHERE status = 'completed'
      AND (? IS NULL OR location_id = ?)
      AND completed_at BETWEEN ? AND ?
  `;
  promises.push(pool.query(appQuery, [locationId, locationId, startDate, endDate]).then(([rows]) => ({
    completedTransactions: Number(rows[0].completedTransactions),
  })));

  // Applications awaiting review
  const pendingAppQuery = `
    SELECT COUNT(*) as applicationsAwaitingReview
    FROM customer_applications
    WHERE status = 'submitted'
      AND (? IS NULL OR location_id = ?)
  `;
  promises.push(pool.query(pendingAppQuery, [locationId, locationId]).then(([rows]) => ({
    applicationsAwaitingReview: Number(rows[0].applicationsAwaitingReview),
  })));

  // Active transfers
  const transferQuery = `
    SELECT COUNT(*) as activeTransfers
    FROM inter_branch_requests
    WHERE status IN ('pending', 'approved', 'in_transit')
      AND (? IS NULL OR source_location_id = ? OR destination_location_id = ?)
  `;
  promises.push(pool.query(transferQuery, [locationId, locationId, locationId]).then(([rows]) => ({
    activeTransfers: Number(rows[0].activeTransfers),
  })));

  const results = await Promise.all(promises);
  return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
};

const getInventoryReport = async ({ locationId, categoryId, search, lowStockOnly }) => {
  const pool = getPool();
  
  let sql = `
    SELECT 
      i.id as inventory_id,
      p.sku,
      p.name as product_name,
      c.name as category_name,
      l.name as location_name,
      i.quantity,
      i.low_stock_threshold
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    JOIN locations l ON i.location_id = l.id
    WHERE 1=1
  `;
  const params = [];

  if (locationId) {
    sql += ' AND i.location_id = ?';
    params.push(locationId);
  }
  if (categoryId) {
    sql += ' AND p.category_id = ?';
    params.push(categoryId);
  }
  if (search) {
    sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (lowStockOnly) {
    sql += ' AND i.quantity <= i.low_stock_threshold';
  }

  sql += ' ORDER BY l.name, c.name, p.name';

  const [rows] = await pool.query(sql, params);
  
  // Map availability
  return rows.map(row => ({
    ...row,
    availability: row.quantity <= 0 ? 'out_of_stock' : (row.quantity <= row.low_stock_threshold ? 'limited_stock' : 'available')
  }));
};

const getMovementReport = async ({ locationId, startDate, endDate, type, limit = 500, offset = 0 }) => {
  const pool = getPool();
  let sql = `
    SELECT 
      m.id,
      m.created_at as date,
      p.sku,
      p.name as product_name,
      c.name as category_name,
      l.name as location_name,
      m.type as movement_type,
      m.quantity,
      m.quantity_before,
      m.quantity_after,
      u.name as performed_by,
      m.reference_type,
      m.reference_id
    FROM stock_movements m
    JOIN products p ON m.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    JOIN locations l ON m.location_id = l.id
    JOIN users u ON m.performed_by_user_id = u.id
    WHERE m.created_at BETWEEN ? AND ?
  `;
  const params = [startDate, endDate];

  if (locationId) {
    sql += ' AND m.location_id = ?';
    params.push(locationId);
  }
  if (type) {
    sql += ' AND m.type = ?';
    params.push(type);
  }

  sql += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
};

const getTransactionReport = async ({ locationId, startDate, endDate, limit = 500, offset = 0 }) => {
  const pool = getPool();
  
  // Completed customer transactions only
  let sql = `
    SELECT 
      a.application_reference,
      a.completed_at,
      p.sku,
      p.name as product_name,
      c.name as category_name,
      a.quantity,
      p.unit_price as catalog_unit_price,
      (a.quantity * p.unit_price) as catalog_value,
      l.name as location_name,
      a.customer_name as completed_for,
      u.name as completed_by
    FROM customer_applications a
    JOIN products p ON a.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    JOIN locations l ON a.location_id = l.id
    JOIN users u ON a.completed_by_user_id = u.id
    WHERE a.status = 'completed'
      AND a.completed_at BETWEEN ? AND ?
  `;
  const params = [startDate, endDate];

  if (locationId) {
    sql += ' AND a.location_id = ?';
    params.push(locationId);
  }

  sql += ' ORDER BY a.completed_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
};

const getTransferReport = async ({ locationId, startDate, endDate, status, limit = 500, offset = 0 }) => {
  const pool = getPool();
  
  let sql = `
    SELECT 
      r.request_reference,
      src.name as source_name,
      dest.name as destination_name,
      r.status,
      r.requested_at,
      r.approved_at,
      r.dispatched_at,
      r.received_at,
      COUNT(i.id) as item_count,
      SUM(i.quantity_requested) as total_units_requested,
      SUM(i.quantity_dispatched) as total_units_dispatched,
      SUM(i.quantity_received) as total_units_received
    FROM inter_branch_requests r
    JOIN locations src ON r.source_location_id = src.id
    JOIN locations dest ON r.destination_location_id = dest.id
    LEFT JOIN inter_branch_request_items i ON r.id = i.request_id
    WHERE r.created_at BETWEEN ? AND ?
  `;
  const params = [startDate, endDate];

  if (locationId) {
    sql += ' AND (r.source_location_id = ? OR r.destination_location_id = ?)';
    params.push(locationId, locationId);
  }
  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }

  sql += ' GROUP BY r.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
};

const getApplicationReport = async ({ locationId, startDate, endDate, status, limit = 500, offset = 0 }) => {
  const pool = getPool();
  
  let sql = `
    SELECT 
      a.application_reference,
      a.customer_name as customer,
      p.name as product_name,
      a.quantity,
      l.name as branch_name,
      a.status,
      a.created_at as submitted_date,
      a.reviewed_at as reviewed_date,
      a.completed_at as completed_date
    FROM customer_applications a
    JOIN products p ON a.product_id = p.id
    JOIN locations l ON a.location_id = l.id
    WHERE a.created_at BETWEEN ? AND ?
  `;
  const params = [startDate, endDate];

  if (locationId) {
    sql += ' AND a.location_id = ?';
    params.push(locationId);
  }
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
};

export default {
  getOverviewStats,
  getInventoryReport,
  getMovementReport,
  getTransactionReport,
  getTransferReport,
  getApplicationReport,
};
