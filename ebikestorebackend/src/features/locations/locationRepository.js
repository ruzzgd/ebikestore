import { query } from '../../db/connection.js';

export const listLocations = async () => {
  const [rows] = await query(
    `SELECT id, code, name, type, is_active, created_at, updated_at 
     FROM locations ORDER BY type ASC, name ASC`
  );
  return rows;
};

export const findLocationById = async (id) => {
  const [rows] = await query(
    `SELECT id, code, name, type, is_active, created_at, updated_at 
     FROM locations WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const findLocationByCode = async (code) => {
  const [rows] = await query(
    `SELECT id, code, name, type, is_active, created_at, updated_at 
     FROM locations WHERE code = ? LIMIT 1`,
    [code]
  );
  return rows.length > 0 ? rows[0] : null;
};

export default {
  listLocations,
  findLocationById,
  findLocationByCode,
};
