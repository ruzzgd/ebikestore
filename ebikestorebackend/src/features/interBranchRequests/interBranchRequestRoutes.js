import { Router } from 'express';
import requestController from './interBranchRequestController.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate, authorize('admin', 'branch_staff', 'warehouse_staff'));
router.post('/', requestController.createRequest);
router.get('/', requestController.listRequests);
router.get('/source-inventory/:locationId', requestController.listSourceInventory);
router.get('/:id', requestController.getRequest);
router.post('/:id/approve', requestController.approveRequest);
router.post('/:id/reject', requestController.rejectRequest);
router.post('/:id/dispatch', requestController.dispatchRequest);
router.post('/:id/receive', requestController.receiveRequest);

export default router;
