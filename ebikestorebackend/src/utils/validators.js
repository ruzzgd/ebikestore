import { BadRequestError } from './errors.js';

/**
 * Validates a human full name.
 * - Allowed: letters (including accented letters), spaces, hyphens (-), periods (.), and apostrophes (').
 * - Disallowed: numbers (0-9) and special characters (@, #, $, %, ^, &, *, etc.).
 * - Length: 2 to 100 characters.
 */
export const validateFullName = (name, fieldName = 'Name') => {
  if (!name || typeof name !== 'string') {
    throw new BadRequestError(`${fieldName} is required`);
  }
  const clean = name.trim();
  if (clean.length < 2 || clean.length > 100) {
    throw new BadRequestError(`${fieldName} must be between 2 and 100 characters`);
  }
  if (/\d/.test(clean)) {
    throw new BadRequestError(`${fieldName} cannot contain numbers`);
  }
  const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s.'-]+$/;
  if (!nameRegex.test(clean) || !/[a-zA-ZÀ-ÿ\u00f1\u00d1]/.test(clean)) {
    throw new BadRequestError(`${fieldName} can only contain letters, spaces, hyphens, periods, and apostrophes. Numbers and special characters are not allowed.`);
  }
  return clean;
};

/**
 * Validates an email address format.
 */
export const validateEmail = (email, fieldName = 'Email address') => {
  if (!email || typeof email !== 'string') {
    throw new BadRequestError(`${fieldName} is required`);
  }
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    throw new BadRequestError(`Enter a valid ${fieldName.toLowerCase()}`);
  }
  return clean;
};

/**
 * Validates a contact/mobile phone number.
 * Supports Philippine mobile format: 11 digits (09XXXXXXXXX) or 10 digits (9XXXXXXXXX) or +639XXXXXXXXX.
 */
export const validateContactNumber = (contactNumber, { required = false, fieldName = 'Contact number' } = {}) => {
  if (!contactNumber) {
    if (required) throw new BadRequestError(`${fieldName} is required`);
    return null;
  }
  const clean = String(contactNumber).trim();
  if (!clean) {
    if (required) throw new BadRequestError(`${fieldName} is required`);
    return null;
  }
  const digits = clean.replace(/\D/g, '');
  const isValid =
    (clean.startsWith('09') && digits.length === 11) ||
    (clean.startsWith('+639') && digits.length === 12) ||
    (clean.startsWith('+63') && digits.length === 12 && digits.startsWith('639')) ||
    (digits.length === 10 && digits.startsWith('9')) ||
    (digits.length === 11 && digits.startsWith('09'));

  if (!isValid) {
    throw new BadRequestError(`Please provide a complete and valid 11-digit mobile number (e.g., 09171234567 or +63 917 123 4567).`);
  }
  return clean;
};

export default {
  validateFullName,
  validateEmail,
  validateContactNumber,
};
