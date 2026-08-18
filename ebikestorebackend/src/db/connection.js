import mysql from 'mysql2/promise';
import config from '../config/index.js';

let pool = null;

/**
 * Get or create MySQL Connection Pool
 * @returns {mysql.Pool}
 */
export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: config.db.waitForConnections,
      connectionLimit: config.db.connectionLimit,
      queueLimit: config.db.queueLimit,
      namedPlaceholders: false,
    });

    console.log(`[DATABASE] MySQL Connection pool initialized for host: ${config.db.host}:${config.db.port}, db: ${config.db.database}`);
  }
  return pool;
};

/**
 * Execute parameterized query with parameters
 * @param {string} sql - Parameterized SQL query string
 * @param {Array} [params] - Array of query parameters
 * @returns {Promise<[Array, Array]>} [rows, fields]
 */
export const query = async (sql, params = []) => {
  const currentPool = getPool();
  const [rows, fields] = await currentPool.execute(sql, params);
  return [rows, fields];
};

/**
 * Close database pool connection gracefully
 */
export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DATABASE] MySQL Connection pool closed gracefully.');
  }
};

export default {
  getPool,
  query,
  closePool,
};
