import userRepository from '../users/userRepository.js';
import { hashPassword, comparePassword, generateVerificationCode } from '../../utils/crypto.js';
import { signToken } from '../../utils/jwt.js';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError, AppError } from '../../utils/errors.js';
import { sendPasswordChangeCodeEmail, sendPasswordResetEmail, sendVerificationEmail } from '../../providers/brevoProvider.js';
import { deleteImage, uploadImage } from '../../providers/minioProvider.js';

export const assertEmailDeliverySucceeded = (emailResult, message) => {
  if (!emailResult?.success) {
    throw new AppError(message, 503);
  }
};

/**
 * Register a new public Customer account
 */
export const registerCustomer = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new BadRequestError('Name, email, and password are required');
  }

  const cleanEmail = email.trim().toLowerCase();

  if (password.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters long');
  }

  // Check for duplicate email
  const existingUser = await userRepository.findUserByEmail(cleanEmail);
  if (existingUser) {
    throw new ConflictError('An account with this email address already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Always create customer role for public registration
  const userId = await userRepository.createUser({
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    role: 'customer',
    isActive: true,
    isEmailVerified: false,
  });

  // Generate 6-digit verification code
  const code = generateVerificationCode();
  const codeHash = await hashPassword(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

  // Invalidate prior codes and save new code hash
  await userRepository.invalidateUserVerificationCodes(userId, 'email_verification');
  await userRepository.createVerificationCode({
    userId,
    purpose: 'email_verification',
    codeHash,
    expiresAt,
  });

  // Send verification email via Brevo provider (non-blocking failure behavior)
  const emailResult = await sendVerificationEmail({
    email: cleanEmail,
    code,
    name: name.trim(),
  });

  if (!emailResult.success) {
    console.warn(`[REGISTRATION WARNING] Account created for ${cleanEmail}, but email sending returned: ${emailResult.error}`);
    await userRepository.deleteUnverifiedUser(userId);
  }

  assertEmailDeliverySucceeded(emailResult, 'Unable to send the verification code right now. Please try signing up again.');

  const user = await userRepository.findUserById(userId);
  return {
    user,
    message: 'Registration successful. A 6-digit verification code has been sent to your email address.',
  };
};

/**
 * Verify Customer Email with 6-digit code
 */
export const verifyEmail = async ({ email, code }) => {
  if (!email || !code) {
    throw new BadRequestError('Email and verification code are required');
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await userRepository.findUserByEmail(cleanEmail);

  if (!user) {
    throw new NotFoundError('No user account found with this email address');
  }

  if (user.is_email_verified) {
    return { verified: true, message: 'Email address is already verified' };
  }

  const activeCodes = await userRepository.findActiveVerificationCodes(user.id, 'email_verification');

  if (!activeCodes || activeCodes.length === 0) {
    throw new BadRequestError('Verification code has expired or is invalid. Please request a new code.');
  }

  let matchedCodeId = null;

  for (const record of activeCodes) {
    const isMatch = await comparePassword(code.trim(), record.code_hash);
    if (isMatch) {
      matchedCodeId = record.id;
      break;
    }
  }

  if (!matchedCodeId) {
    throw new BadRequestError('Invalid verification code. Please check your code and try again.');
  }

  // Update user verification status and consume code
  await userRepository.updateUserEmailVerified(user.id, true);
  await userRepository.markVerificationCodeConsumed(matchedCodeId);
  await userRepository.invalidateUserVerificationCodes(user.id, 'email_verification');

  return {
    verified: true,
    message: 'Email verified successfully. You may now log in to your account.',
  };
};

/**
 * Resend Email Verification Code
 */
export const resendVerification = async ({ email }) => {
  if (!email) {
    throw new BadRequestError('Email address is required');
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await userRepository.findUserByEmail(cleanEmail);

  if (!user) {
    throw new NotFoundError('No user account found with this email address');
  }

  if (user.is_email_verified) {
    return { message: 'Email address is already verified' };
  }

  // Invalidate old codes
  await userRepository.invalidateUserVerificationCodes(user.id, 'email_verification');

  // Generate new code
  const code = generateVerificationCode();
  const codeHash = await hashPassword(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await userRepository.createVerificationCode({
    userId: user.id,
    purpose: 'email_verification',
    codeHash,
    expiresAt,
  });

  const emailResult = await sendVerificationEmail({
    email: cleanEmail,
    code,
    name: user.name,
  });

  assertEmailDeliverySucceeded(emailResult, 'Unable to resend the verification code right now');

  return {
    message: 'A new 6-digit verification code has been sent to your email address.',
  };
};

/**
 * Login User
 */
export const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await userRepository.findUserByEmail(cleanEmail);

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.is_active) {
    throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
  }

  // Reject unverified customers with structured EMAIL_NOT_VERIFIED error
  if (!user.is_email_verified) {
    const unverifiedError = new AppError('Please verify your email before signing in.', 401, {
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email,
    });
    unverifiedError.code = 'EMAIL_NOT_VERIFIED';
    throw unverifiedError;
  }

  // Generate JWT Token
  const token = signToken({
    userId: user.id,
    role: user.role,
    isActive: user.is_active,
  });

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    birth_date: user.birth_date,
    contact_number: user.contact_number,
    address: user.address,
    avatar_key: user.avatar_key,
    role: user.role,
    location_id: user.location_id,
    location_name: user.location_name,
    location_code: user.location_code,
    location_type: user.location_type,
    is_active: Boolean(user.is_active),
    is_email_verified: Boolean(user.is_email_verified),
  };

  return { token, user: safeUser };
};

export const requestPasswordReset = async ({ email }) => {
  if (!email) throw new BadRequestError('Email address is required');
  const cleanEmail = email.trim().toLowerCase();
  const user = await userRepository.findUserByEmail(cleanEmail);

  // Always return the same response so this endpoint cannot reveal registered accounts.
  if (user?.is_active) {
    const code = generateVerificationCode();
    const codeHash = await hashPassword(code);
    await userRepository.invalidateUserVerificationCodes(user.id, 'password_reset');
    await userRepository.createVerificationCode({
      userId: user.id,
      purpose: 'password_reset',
      codeHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    await sendPasswordResetEmail({ email: cleanEmail, code, name: user.name });
  }

  return { message: 'If an active account matches that email, a reset code has been sent.' };
};

export const resetPassword = async ({ email, code, password }) => {
  if (!email || !code || !password) throw new BadRequestError('Email, reset code, and new password are required');
  if (password.length < 8) throw new BadRequestError('New password must be at least 8 characters long');
  const cleanEmail = email.trim().toLowerCase();
  const user = await userRepository.findUserByEmail(cleanEmail);
  if (!user?.is_active) throw new BadRequestError('The reset code is invalid or has expired');

  const activeCodes = await userRepository.findActiveVerificationCodes(user.id, 'password_reset');
  let matchedCodeId = null;
  for (const record of activeCodes) {
    if (await comparePassword(code.trim(), record.code_hash)) {
      matchedCodeId = record.id;
      break;
    }
  }
  if (!matchedCodeId) throw new BadRequestError('The reset code is invalid or has expired');

  await userRepository.updateUserPassword(user.id, await hashPassword(password));
  await userRepository.markVerificationCodeConsumed(matchedCodeId);
  await userRepository.invalidateUserVerificationCodes(user.id, 'password_reset');
  return { message: 'Password updated successfully. You can now sign in.' };
};

export const updateProfile = async (userId, { name, email, birthDate, contactNumber, address }) => {
  if (!name || !email) throw new BadRequestError('Name and email address are required');
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanName.length < 2 || cleanName.length > 100) throw new BadRequestError('Name must be between 2 and 100 characters');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new BadRequestError('Enter a valid email address');
  const existing = await userRepository.findUserByEmail(cleanEmail);
  if (existing && existing.id !== userId) throw new ConflictError('That email address is already in use');

  let cleanBirthDate = birthDate ? String(birthDate).trim() : null;
  if (cleanBirthDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanBirthDate)) {
      throw new BadRequestError('Invalid date of birth format. Use YYYY-MM-DD');
    }
  } else {
    cleanBirthDate = null;
  }

  const cleanContact = contactNumber ? String(contactNumber).trim().slice(0, 50) : null;
  const cleanAddress = address ? String(address).trim() : null;

  await userRepository.updateUserProfile(userId, {
    name: cleanName,
    email: cleanEmail,
    birthDate: cleanBirthDate,
    contactNumber: cleanContact,
    address: cleanAddress,
  });
  return getCurrentUser(userId);
};

export const updateAvatar = async (userId, file) => {
  if (!file) throw new BadRequestError('Choose an avatar image to upload');
  const user = await userRepository.findUserById(userId);
  if (!user) throw new NotFoundError('User profile not found');
  const avatarKey = await uploadImage(file.buffer, file.mimetype, file.originalname);
  await userRepository.updateUserAvatar(userId, avatarKey);
  if (user.avatar_key) await deleteImage(user.avatar_key);
  return getCurrentUser(userId);
};

export const requestPasswordChangeCode = async (userId) => {
  const user = await userRepository.findUserByEmail((await getCurrentUser(userId)).email);
  const code = generateVerificationCode();
  await userRepository.invalidateUserVerificationCodes(user.id, 'password_change');
  await userRepository.createVerificationCode({ userId, purpose: 'password_change', codeHash: await hashPassword(code), expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
  const result = await sendPasswordChangeCodeEmail({ email: user.email, code, name: user.name });
  if (!result.success) throw new AppError('Unable to send confirmation code right now', 503);
  return { message: `A confirmation code was sent to ${user.email}.` };
};

export const changePasswordWithCode = async (userId, { code, password }) => {
  if (!code || !password) throw new BadRequestError('Confirmation code and new password are required');
  if (password.length < 8) throw new BadRequestError('New password must be at least 8 characters long');
  const activeCodes = await userRepository.findActiveVerificationCodes(userId, 'password_change');
  let matchedCodeId = null;
  for (const record of activeCodes) if (await comparePassword(code.trim(), record.code_hash)) { matchedCodeId = record.id; break; }
  if (!matchedCodeId) throw new BadRequestError('The confirmation code is invalid or has expired');
  await userRepository.updateUserPassword(userId, await hashPassword(password));
  await userRepository.markVerificationCodeConsumed(matchedCodeId);
  await userRepository.invalidateUserVerificationCodes(userId, 'password_change');
  return { message: 'Password changed successfully.' };
};

/**
 * Get current authenticated user profile
 */
export const getCurrentUser = async (userId) => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new NotFoundError('User profile not found');
  }
  return user;
};

/**
 * Re-authenticate user for sensitive actions
 */
export const verifyCurrentPassword = async (userId, password) => {
  if (!password) {
    throw new BadRequestError('Password confirmation is required for this action');
  }
  const user = await userRepository.findUserAuthById(userId);
  if (!user) {
    throw new UnauthorizedError('User profile not found');
  }
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid password confirmation');
  }
  return true;
};

export default {
  registerCustomer,
  verifyEmail,
  resendVerification,
  login,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  updateAvatar,
  requestPasswordChangeCode,
  changePasswordWithCode,
  getCurrentUser,
  verifyCurrentPassword,
};
