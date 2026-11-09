import { Router } from 'express';
import uploadController from './uploadController.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

const router = Router();

// Public Image Stream Endpoint
router.get('/images/*', uploadController.getImageStream);

// Product Image Upload Endpoint (Admin, Branch Staff, Warehouse Staff)
router.post(
  '/product-image',
  authenticate,
  authorize('admin', 'branch_staff', 'warehouse_staff'),
  uploadController.multerUploadMiddleware,
  uploadController.uploadProductImage
);

export default router;
