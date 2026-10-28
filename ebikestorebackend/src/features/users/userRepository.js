import { query } from '../../db/connection.js';

/**
 * Find user by email address
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export const findUserByEmail = async (email) => {
  const [rows] = await query(
    `SELECT u.id, u.name, u.email, u.birth_date, u.contact_number, u.address, u.avatar_key, u.password_hash, u.role, u.location_id, u.is_active, u.is_email_verified, u.created_at, u.updated_at,
            l.name AS location_name, l.code AS location_code, l.type AS location_type
     FROM users u
     LEFT JOIN locations l ON u.location_id = l.id
     WHERE u.email = ? LIMIT 1`,
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Find user by primary key ID
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export const findUserById = async (id) => {
  const [rows] = await query(
    `SELECT u.id, u.name, u.email, u.birth_date, u.contact_number, u.address, u.avatar_key, u.role, u.location_id, u.is_active, u.is_email_verified, u.created_at, u.updated_at,
            l.name AS location_name, l.code AS location_code, l.type AS location_type
     FROM users u
     LEFT JOIN locations l ON u.location_id = l.id
     WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const findUserAuthById = async (id) => {
  const [rows] = await query(
    `SELECT id, password_hash, is_active FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Create a new user record
 * @param {object} userData
 * @returns {Promise<number>} New user ID
 */
export const createUser = async ({ name, email, passwordHash, role = 'customer', locationId = null, isActive = true, isEmailVerified = false }) => {
  const [result] = await query(
    `INSERT INTO users (name, email, password_hash, role, location_id, is_active, is_email_verified) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, passwordHash, role, locationId, isActive, isEmailVerified]
  );
  return result.insertId;
};

/**
 * Remove a newly-created account if its initial verification email could not be delivered.
 * The verification guard prevents this cleanup from deleting a completed account.
 */
export const deleteUnverifiedUser = async (userId) => {
  const [result] = await query(
    `DELETE FROM users WHERE id = ? AND is_email_verified = false`,
    [userId]
  );
  return result.affectedRows > 0;
};

/**
 * Update user email verification status
 * @param {number} userId
 * @param {boolean} isVerified
 */
export const updateUserEmailVerified = async (userId, isVerified) => {
  await query(`UPDATE users SET is_email_verified = ? WHERE id = ?`, [isVerified, userId]);
};

/**
 * Update user active status
 * @param {number} userId
 * @param {boolean} isActive
 */
export const updateUserActiveStatus = async (userId, isActive) => {
  await query(`UPDATE users SET is_active = ? WHERE id = ?`, [isActive, userId]);
};

export const updateUserPassword = async (userId, passwordHash) => {
  await query(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [passwordHash, userId]);
};

export const updateUserProfile = async (userId, { name, email, birthDate = null, contactNumber = null, address = null }) => {
  await query(
    `UPDATE users
     SET name = ?, email = ?, birth_date = ?, contact_number = ?, address = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, email, birthDate || null, contactNumber || null, address || null, userId]
  );
};

export const updateUserAvatar = async (userId, avatarKey) => {
  await query(`UPDATE users SET avatar_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [avatarKey, userId]);
};

/**
 * List users (excluding password_hash)
 * @param {object} options
 * @returns {Promise<Array>}
 */
export const listUsers = async ({ limit = 50, offset = 0, includeUnverified = false } = {}) => {
  const safeLimit = Math.max(1, parseInt(limit, 10) || 50);
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);
  const whereClause = includeUnverified ? '' : "WHERE (u.role != 'customer' OR u.is_email_verified = true)";
  const [rows] = await query(
    `SELECT u.id, u.name, u.email, u.birth_date, u.contact_number, u.address, u.avatar_key, u.role, u.location_id, u.is_active, u.is_email_verified, u.created_at, u.updated_at,
            l.name AS location_name, l.code AS location_code, l.type AS location_type
     FROM users u
     LEFT JOIN locations l ON u.location_id = l.id
     ${whereClause}
     ORDER BY u.created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`
  );
  return rows;
};

/**
 * Save new verification code hash
 * @param {object} codeData
 */
export const createVerificationCode = async ({ userId, purpose = 'email_verification', codeHash, expiresAt }) => {
  const [result] = await query(
    `INSERT INTO verification_codes (user_id, purpose, code_hash, expires_at, is_consumed) 
     VALUES (?, ?, ?, ?, false)`,
    [userId, purpose, codeHash, expiresAt]
  );
  return result.insertId;
};

/**
 * Find all active, unexpired verification codes for a user
 * @param {number} userId
 * @param {string} purpose
 * @returns {Promise<Array>}
 */
export const findActiveVerificationCodes = async (userId, purpose = 'email_verification') => {
  const [rows] = await query(
    `SELECT id, user_id, purpose, code_hash, expires_at, is_consumed, created_at 
     FROM verification_codes 
     WHERE user_id = ? AND purpose = ? AND is_consumed = false AND expires_at > NOW() 
     ORDER BY created_at DESC`,
    [userId, purpose]
  );
  return rows;
};

/**
 * Mark all existing active verification codes for a user as consumed/invalid
 * @param {number} userId
 * @param {string} purpose
 */
export const invalidateUserVerificationCodes = async (userId, purpose = 'email_verification') => {
  await query(
    `UPDATE verification_codes SET is_consumed = true WHERE user_id = ? AND purpose = ? AND is_consumed = false`,
    [userId, purpose]
  );
};

/**
 * Mark a specific verification code as consumed
 * @param {number} codeId
 */
export const markVerificationCodeConsumed = async (codeId) => {
  await query(`UPDATE verification_codes SET is_consumed = true WHERE id = ?`, [codeId]);
};

export const hasUserActivity = async (userId) => {
  const [apps] = await query('SELECT 1 FROM customer_applications WHERE customer_user_id = ? OR reviewed_by_user_id = ? OR completed_by_user_id = ? LIMIT 1', [userId, userId, userId]);
  if (apps.length > 0) return true;
  const [movements] = await query('SELECT 1 FROM stock_movements WHERE performed_by_user_id = ? LIMIT 1', [userId]);
  if (movements.length > 0) return true;
  const [requests] = await query('SELECT 1 FROM inter_branch_requests WHERE requested_by_user_id = ? OR approved_by_user_id = ? OR dispatched_by_user_id = ? OR received_by_user_id = ? OR rejected_by_user_id = ? LIMIT 1', [userId, userId, userId, userId, userId]);
  if (requests.length > 0) return true;
  return false;
};

export const deleteUserById = async (userId) => {
  await query('DELETE FROM notifications WHERE user_id = ?', [userId]);
  await query('DELETE FROM verification_codes WHERE user_id = ?', [userId]);
  const [result] = await query('DELETE FROM users WHERE id = ?', [userId]);
  return result.affectedRows > 0;
};

export default {
  findUserByEmail,
  findUserById,
  findUserAuthById,
  createUser,
  deleteUnverifiedUser,
  updateUserEmailVerified,
  updateUserActiveStatus,
  updateUserPassword,
  updateUserProfile,
  updateUserAvatar,
  listUsers,
  createVerificationCode,
  findActiveVerificationCodes,
  invalidateUserVerificationCodes,
  markVerificationCodeConsumed,
  hasUserActivity,
  deleteUserById,
};
