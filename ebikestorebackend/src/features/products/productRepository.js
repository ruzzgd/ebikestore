import { query } from '../../db/connection.js';

export const listProducts = async ({ activeOnly = false, categoryId = null, search = '', limit = 50, offset = 0 } = {}) => {
  let sql = `
    SELECT p.id, p.category_id, p.sku, p.name, p.description, p.unit_price, p.image_key, p.is_active, p.created_at, p.updated_at,
           c.name AS category_name,
           COALESCE((
             SELECT SUM(i.quantity)
             FROM inventory i
             INNER JOIN locations l ON l.id = i.location_id AND l.is_active = true
             WHERE i.product_id = p.id AND i.is_archived = false
           ), 0) AS total_stock,
           CASE
             WHEN EXISTS (
               SELECT 1 FROM inventory i
               INNER JOIN locations l ON l.id = i.location_id AND l.is_active = true
               WHERE i.product_id = p.id AND i.quantity > i.low_stock_threshold
             ) THEN 'available'
             WHEN EXISTS (
               SELECT 1 FROM inventory i
               INNER JOIN locations l ON l.id = i.location_id AND l.is_active = true
               WHERE i.product_id = p.id AND i.quantity > 0
             ) THEN 'limited_stock'
             ELSE 'out_of_stock'
           END AS availability
    FROM products p
    INNER JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (activeOnly) {
    sql += ` AND p.is_active = true AND c.is_active = true`;
  }

  if (categoryId) {
    sql += ` AND p.category_id = ?`;
    params.push(Number(categoryId));
  }

  if (search && search.trim()) {
    sql += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)`;
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  const safeLimit = Math.max(1, parseInt(limit, 10) || 50);
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

  sql += ` ORDER BY p.created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

  const [rows] = await query(sql, params);
  return rows;
};

export const findProductById = async (id) => {
  const [rows] = await query(
    `SELECT p.id, p.category_id, p.sku, p.name, p.description, p.unit_price, p.image_key, p.is_active, p.created_at, p.updated_at,
            c.name AS category_name,
            COALESCE((
              SELECT SUM(i.quantity)
              FROM inventory i
              INNER JOIN locations l ON l.id = i.location_id AND l.is_active = true
              WHERE i.product_id = p.id AND i.is_archived = false
            ), 0) AS total_stock,
            CASE
              WHEN EXISTS (
                SELECT 1 FROM inventory i
                INNER JOIN locations l ON l.id = i.location_id AND l.is_active = true
                WHERE i.product_id = p.id AND i.quantity > i.low_stock_threshold
              ) THEN 'available'
              WHEN EXISTS (
                SELECT 1 FROM inventory i
                INNER JOIN locations l ON l.id = i.location_id AND l.is_active = true
                WHERE i.product_id = p.id AND i.quantity > 0
              ) THEN 'limited_stock'
              ELSE 'out_of_stock'
            END AS availability
     FROM products p
     INNER JOIN categories c ON p.category_id = c.id
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const findProductBySku = async (sku) => {
  const [rows] = await query(
    `SELECT p.id, p.category_id, p.sku, p.name, p.description, p.unit_price, p.image_key, p.is_active, p.created_at, p.updated_at,
            c.name AS category_name
     FROM products p
     INNER JOIN categories c ON p.category_id = c.id
     WHERE p.sku = ? LIMIT 1`,
    [sku]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const listPublicAvailabilityByProduct = async (productId) => {
  const [rows] = await query(
    `SELECT l.id AS location_id, l.name AS location_name, l.type AS location_type,
            CASE
              WHEN COALESCE(i.quantity, 0) <= 0 THEN 'out_of_stock'
              WHEN i.quantity <= i.low_stock_threshold THEN 'limited_stock'
              ELSE 'available'
            END AS availability
     FROM locations l
     LEFT JOIN inventory i ON i.location_id = l.id AND i.product_id = ?
     WHERE l.is_active = true
     ORDER BY l.type ASC, l.name ASC`,
    [productId]
  );
  return rows;
};

export const createProduct = async ({ categoryId, sku, name, description = '', unitPrice = 0.00, imageKey = null, isActive = true }) => {
  const [result] = await query(
    `INSERT INTO products (category_id, sku, name, description, unit_price, image_key, is_active) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [categoryId, sku, name, description, unitPrice, imageKey, isActive]
  );
  return result.insertId;
};

export const updateProduct = async (id, { categoryId, sku, name, description, unitPrice, imageKey, isActive }) => {
  await query(
    `UPDATE products 
     SET category_id = ?, sku = ?, name = ?, description = ?, unit_price = ?, image_key = ?, is_active = ? 
     WHERE id = ?`,
    [categoryId, sku, name, description, unitPrice, imageKey, isActive, id]
  );
};

export const updateProductActiveStatus = async (id, isActive) => {
  await query(`UPDATE products SET is_active = ? WHERE id = ?`, [isActive, id]);
};

export default {
  listProducts,
  findProductById,
  findProductBySku,
  listPublicAvailabilityByProduct,
  createProduct,
  updateProduct,
  updateProductActiveStatus,
};
