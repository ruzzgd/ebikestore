import { Router } from 'express';
import uploadController from './uploadController.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

const router = Router();

// Public Image Stream Endpoint
router.get('/images/*', uploadController.getImageStream);

// Admin Product Image Upload Endpoint
router.post(
  '/product-image',
  authenticate,
  authorize('admin'),
  uploadController.multerUploadMiddleware,
  uploadController.uploadProductImage
);

export default router;
