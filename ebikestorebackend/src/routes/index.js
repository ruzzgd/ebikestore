import { Router } from 'express';
import healthRoutes from '../features/health/healthRoutes.js';
import authRoutes from '../features/auth/authRoutes.js';
import userRoutes from '../features/users/userRoutes.js';
import locationRoutes from '../features/locations/locationRoutes.js';
import categoryRoutes from '../features/categories/categoryRoutes.js';
import productRoutes from '../features/products/productRoutes.js';
import uploadRoutes from '../features/uploads/uploadRoutes.js';
import inventoryRoutes from '../features/inventory/inventoryRoutes.js';
import interBranchRequestRoutes from '../features/interBranchRequests/interBranchRequestRoutes.js';
import applicationRoutes from '../features/applications/applicationRoutes.js';
import notificationRoutes from '../features/notifications/notificationRoutes.js';
import reportRoutes from '../features/reports/reportRoutes.js';
import { generateCsrfToken } from '../middleware/csrfMiddleware.js';

const router = Router();

// Mount feature routes
router.get('/csrf-token', generateCsrfToken);
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/locations', locationRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/uploads', uploadRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/inter-branch-requests', interBranchRequestRoutes);
router.use('/applications', applicationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);

export default router;
