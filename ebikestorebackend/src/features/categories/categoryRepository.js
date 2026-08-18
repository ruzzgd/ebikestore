import { query } from '../../db/connection.js';

export const listCategories = async ({ activeOnly = false } = {}) => {
  let sql = `SELECT id, name, description, is_active, created_at, updated_at FROM categories`;
  const params = [];

  if (activeOnly) {
    sql += ` WHERE is_active = true`;
  }

  sql += ` ORDER BY name ASC`;

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

export default {
  listCategories,
  findCategoryById,
  findCategoryByName,
  createCategory,
  updateCategory,
  updateCategoryActiveStatus,
};
