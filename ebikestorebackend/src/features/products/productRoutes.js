import { Router } from 'express';
import productController from './productController.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

const router = Router();

// Public Catalog Product Routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Admin Product Management Routes
router.post('/', authenticate, authorize('admin'), productController.createProduct);
router.put('/:id', authenticate, authorize('admin'), productController.updateProduct);
router.patch('/:id/active', authenticate, authorize('admin'), productController.updateProductActive);

export default router;
