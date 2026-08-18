import { Router } from 'express';
import categoryController from './categoryController.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

const router = Router();

// Public Category Routes
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin Category Routes
router.post('/', authenticate, authorize('admin'), categoryController.createCategory);
router.put('/:id', authenticate, authorize('admin'), categoryController.updateCategory);
router.patch('/:id/active', authenticate, authorize('admin'), categoryController.updateCategoryActive);

export default router;
