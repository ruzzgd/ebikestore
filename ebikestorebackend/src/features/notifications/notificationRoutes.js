import { Router } from 'express';
import notificationController from './notificationController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate);
router.get('/', notificationController.listNotifications);
router.get('/unread-count', notificationController.unreadCount);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

export default router;
