import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authController from './authController.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 10,
  message: { status: 'error', message: 'Too many login attempts, please try again later.' }
});

const verifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 verify/resend requests per windowMs
  message: { status: 'error', message: 'Too many verification attempts, please try again later.' }
});

const router = Router();

// Public auth endpoints
router.post('/register', authController.register);
router.post('/verify-email', verifyLimiter, authController.verifyEmail);
router.post('/resend-verification', verifyLimiter, authController.resendVerification);
router.post('/forgot-password', verifyLimiter, authController.requestPasswordReset);
router.post('/reset-password', verifyLimiter, authController.resetPassword);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);

// Protected current user endpoint
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, authController.updateProfile);
router.post('/me/avatar', authenticate, authController.avatarUploadMiddleware, authController.updateAvatar);
router.post('/me/password-code', authenticate, verifyLimiter, authController.requestPasswordChangeCode);
router.post('/me/change-password', authenticate, verifyLimiter, authController.changePassword);

// Admin endpoints
router.get('/audit-logs', authenticate, authorize('admin'), authController.getAuditLogs);

export default router;
