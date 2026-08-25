import { Router } from 'express';
import inventoryController from './inventoryController.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate, authorize('admin', 'branch_staff', 'warehouse_staff'));
router.get('/', inventoryController.listInventory);
router.get('/low-stock', inventoryController.listLowStock);
router.get('/movements', inventoryController.listMovements);
router.get('/product/:productId/location/:locationId', inventoryController.getInventoryRecord);
router.post('/stock-in', inventoryController.stockIn);
router.post('/stock-out', inventoryController.stockOut);
router.post('/walk-in-sale', inventoryController.walkInSale);
router.patch('/:id/threshold', inventoryController.updateThreshold);
router.patch('/:id/archive', inventoryController.updateArchivedState);

export default router;
