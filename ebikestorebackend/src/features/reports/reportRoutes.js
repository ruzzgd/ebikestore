import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import reportController from './reportController.js';

const router = Router();

// Apply auth middleware to all report routes
router.use(authenticate);
router.use(authorize('admin', 'branch_staff', 'warehouse_staff'));

router.get('/overview', reportController.getOverview);
router.get('/inventory', reportController.getInventory);
router.get('/movements', reportController.getMovements);
router.get('/transactions', reportController.getTransactions);
router.get('/transfers', reportController.getTransfers);
router.get('/applications', reportController.getApplications);

export default router;
