import { Router } from 'express';
import productController from './productController.js';
import { authenticate, optionalAuthenticate, authorize } from '../../middleware/authMiddleware.js';

const router = Router();

// Public Catalog Product Routes
router.get('/', optionalAuthenticate, productController.getProducts);
router.get('/:id', optionalAuthenticate, productController.getProductById);

// Admin Product Management Routes
router.post('/', authenticate, authorize('admin'), productController.createProduct);
router.put('/:id', authenticate, authorize('admin'), productController.updateProduct);
router.patch('/:id/active', authenticate, authorize('admin'), productController.updateProductActive);

export default router;
