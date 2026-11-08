import { Router } from 'express';
import productController from './productController.js';
import { authenticate, optionalAuthenticate, authorize } from '../../middleware/authMiddleware.js';

const router = Router();

// Public Catalog Product Routes
router.get('/', optionalAuthenticate, productController.getProducts);
router.get('/:id', optionalAuthenticate, productController.getProductById);

// Product Management Routes (Admin, Branch Staff, Warehouse Staff)
router.post('/', authenticate, authorize('admin', 'branch_staff', 'warehouse_staff'), productController.createProduct);
router.put('/:id', authenticate, authorize('admin', 'branch_staff', 'warehouse_staff'), productController.updateProduct);
router.patch('/:id/active', authenticate, authorize('admin'), productController.updateProductActive);

export default router;
