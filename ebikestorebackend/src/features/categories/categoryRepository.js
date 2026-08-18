import { query } from '../../db/connection.js';

export const listCategories = async ({ activeOnly = false } = {}) => {
  let sql = `SELECT c.id, c.name, c.description, c.is_active, c.created_at, c.updated_at,
                    COUNT(CASE WHEN p.is_active = true THEN 1 END) AS active_product_count
             FROM categories c
             LEFT JOIN products p ON p.category_id = c.id`;
  const params = [];

  if (activeOnly) {
    sql += ` WHERE c.is_active = true`;
  }

  sql += ` GROUP BY c.id, c.name, c.description, c.is_active, c.created_at, c.updated_at
           ORDER BY c.name ASC`;

  const [rows] = await query(sql, params);
  return rows;
};

export const findCategoryById = async (id) => {
  const [rows] = await query(
    `SELECT id, name, description, is_active, created_at, updated_at FROM categories WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const findCategoryByName = async (name) => {
  const [rows] = await query(
    `SELECT id, name, description, is_active, created_at, updated_at FROM categories WHERE name = ? LIMIT 1`,
    [name]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const createCategory = async ({ name, description = '' }) => {
  const [result] = await query(
    `INSERT INTO categories (name, description, is_active) VALUES (?, ?, true)`,
    [name, description]
  );
  return result.insertId;
};

export const updateCategory = async (id, { name, description, isActive }) => {
  await query(
    `UPDATE categories SET name = ?, description = ?, is_active = ? WHERE id = ?`,
    [name, description, isActive, id]
  );
};

export const updateCategoryActiveStatus = async (id, isActive) => {
  await query(`UPDATE categories SET is_active = ? WHERE id = ?`, [isActive, id]);
};

export const countActiveProductsByCategory = async (id) => {
  const [rows] = await query(
    `SELECT COUNT(*) AS count FROM products WHERE category_id = ? AND is_active = true`,
    [id]
  );
  return Number(rows[0]?.count || 0);
};

export default {
  listCategories,
  findCategoryById,
  findCategoryByName,
  createCategory,
  updateCategory,
  updateCategoryActiveStatus,
  countActiveProductsByCategory,
};
