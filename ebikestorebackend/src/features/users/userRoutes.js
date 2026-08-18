import { Router } from 'express';
import userController from './userController.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

const router = Router();

// All user management routes require Admin authentication
router.use(authenticate, authorize('admin'));

router.post('/staff', userController.createStaff);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id/active', userController.updateUserActive);

export default router;
