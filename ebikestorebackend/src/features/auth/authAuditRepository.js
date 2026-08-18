import { query } from '../../db/connection.js';

/**
 * Log an authentication event
 */
export const logAuthEvent = async ({ userId, emailAttempted, eventType, ipAddress, userAgent, success }) => {
  const sqlQuery = `
    INSERT INTO auth_audit_logs 
    (user_id, email_attempted, event_type, ip_address, user_agent, success) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await query(sqlQuery, [
    userId || null,
    emailAttempted || null,
    eventType,
    ipAddress || 'unknown',
    userAgent || null,
    success
  ]);
  return result.insertId;
};

/**
 * Get auth audit logs with pagination and filters
 */
export const getAuditLogs = async ({ limit, offset, eventType, email, startDate, endDate }) => {
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
  let sqlQuery = `
    SELECT a.*, u.name as user_name, u.email as user_email
    FROM auth_audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (eventType) {
    sqlQuery += ` AND a.event_type = ?`;
    params.push(eventType);
  }
  if (email) {
    sqlQuery += ` AND (a.email_attempted LIKE ? OR u.email LIKE ?)`;
    const searchEmail = `%${email}%`;
    params.push(searchEmail, searchEmail);
  }
  if (startDate) {
    sqlQuery += ` AND a.created_at >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    sqlQuery += ` AND a.created_at <= ?`;
    params.push(endDate);
  }

  // mysql2/MySQL 8 can reject LIMIT/OFFSET placeholders with prepared execution.
  // These values are parsed and bounded integers, so safe interpolation is intentional.
  sqlQuery += ` ORDER BY a.created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

  const [rows] = await query(sqlQuery, params);
  
  // Count query for pagination
  let countQuery = `
    SELECT COUNT(*) as total
    FROM auth_audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const countParams = [...params];
  
  // Rebuild count conditions based on original logic (a bit repetitive but safe)
  if (eventType) {
    countQuery += ` AND a.event_type = ?`;
  }
  if (email) {
    countQuery += ` AND (a.email_attempted LIKE ? OR u.email LIKE ?)`;
  }
  if (startDate) {
    countQuery += ` AND a.created_at >= ?`;
  }
  if (endDate) {
    countQuery += ` AND a.created_at <= ?`;
  }

  const [[{ total }]] = await query(countQuery, countParams);

  return {
    logs: rows,
    total
  };
};

export default {
  logAuthEvent,
  getAuditLogs
};
