import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Hash plain text password or code using bcrypt
 * @param {string} text
 * @returns {Promise<string>} Hashed string
 */
export const hashPassword = async (text) => {
  if (!text) {
    throw new Error('Text is required for hashing');
  }
  return await bcrypt.hash(String(text), SALT_ROUNDS);
};

/**
 * Compare plain text string with hash
 * @param {string} text
 * @param {string} hashedText
 * @returns {Promise<boolean>} Match result
 */
export const comparePassword = async (text, hashedText) => {
  if (!text || !hashedText) {
    return false;
  }
  return await bcrypt.compare(String(text), hashedText);
};

/**
 * Generate secure random 6-digit numeric verification code
 * @returns {string} 6-digit code string (e.g. "482915")
 */
export const generateVerificationCode = () => {
  const number = crypto.randomInt(100000, 1000000);
  return String(number);
};
