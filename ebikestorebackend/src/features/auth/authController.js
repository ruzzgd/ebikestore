import asyncHandler from '../../middleware/asyncHandler.js';
import authService from './authService.js';
import config from '../../config/index.js';
import authAuditRepository from './authAuditRepository.js';
import multer from 'multer';
import { BadRequestError } from '../../utils/errors.js';

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)) return callback(new BadRequestError('Avatar must be a JPEG, PNG, or WebP image'));
    callback(null, true);
  },
});
export const avatarUploadMiddleware = avatarUpload.single('avatar');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.registerCustomer({ name, email, password });
  res.status(201).json({
    status: 'success',
    data: result,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const result = await authService.verifyEmail({ email, code });
  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.resendVerification({ email });
  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset({ email: req.body.email });
  res.status(200).json({ status: 'success', data: result });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  res.status(200).json({ status: 'success', data: result });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  try {
    const { token, user } = await authService.login({ email, password });

    // Log successful login
    await authAuditRepository.logAuthEvent({
      userId: user.id,
      emailAttempted: email,
      eventType: 'login_success',
      ipAddress,
      userAgent,
      success: true
    });

    // Set HTTP-Only authentication cookie
    res.cookie(config.jwt.cookieName, token, COOKIE_OPTIONS);

    res.status(200).json({
      status: 'success',
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    // Log failed login
    await authAuditRepository.logAuthEvent({
      userId: null,
      emailAttempted: email,
      eventType: 'login_failed',
      ipAddress,
      userAgent,
      success: false
    });
    throw error;
  }
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.userId);
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.userId, req.body);
  res.status(200).json({ status: 'success', data: { user } });
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const user = await authService.updateAvatar(req.user.userId, req.file);
  res.status(200).json({ status: 'success', data: { user } });
});

export const requestPasswordChangeCode = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordChangeCode(req.user.userId);
  res.status(200).json({ status: 'success', data: result });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePasswordWithCode(req.user.userId, req.body);
  res.status(200).json({ status: 'success', data: result });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await authAuditRepository.logAuthEvent({
      userId: req.user.userId,
      emailAttempted: null,
      eventType: 'logout',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || '',
      success: true
    });
  }

  res.clearCookie(config.jwt.cookieName, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { eventType, email, startDate, endDate, page = 1, limit = 50 } = req.query;
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (safePage - 1) * safeLimit;

  const result = await authAuditRepository.getAuditLogs({
    eventType,
    email,
    startDate,
    endDate,
    limit: safeLimit,
    offset
  });

  res.status(200).json({
    status: 'success',
    data: {
      logs: result.logs,
      total: result.total,
      page: safePage,
      limit: safeLimit
    },
  });
});

export default {
  register,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  login,
  getMe,
  avatarUploadMiddleware,
  updateProfile,
  updateAvatar,
  requestPasswordChangeCode,
  changePassword,
  logout,
  getAuditLogs,
};
