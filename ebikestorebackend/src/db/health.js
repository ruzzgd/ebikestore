import { query } from './connection.js';

/**
 * Check database connection status
 * @returns {Promise<{ isHealthy: boolean, latencyMs: number, message: string }>}
 */
export const checkDatabaseHealth = async () => {
  const startTime = Date.now();
  try {
    const [rows] = await query('SELECT 1 AS alive');
    const latencyMs = Date.now() - startTime;
    const isHealthy = Boolean(rows && rows.length > 0 && rows[0].alive === 1);

    return {
      isHealthy,
      latencyMs,
      message: isHealthy ? 'Database connection active' : 'Database query returned unexpected result',
    };
  } catch (error) {
    return {
      isHealthy: false,
      latencyMs: Date.now() - startTime,
      message: `Database connection failed: ${error.message}`,
    };
  }
};
