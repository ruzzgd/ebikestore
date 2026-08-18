import { Router } from 'express';
import applicationController from './applicationController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate);
router.post('/', applicationController.createApplication);
router.get('/me', applicationController.listMyApplications);
router.get('/', applicationController.listApplications);
router.get('/:id', applicationController.getApplication);
router.post('/:id/review', applicationController.startReview);
router.post('/:id/approve', applicationController.approveApplication);
router.post('/:id/reject', applicationController.rejectApplication);
router.post('/:id/cancel', applicationController.cancelApplication);
router.post('/:id/complete', applicationController.completeApplication);

export default router;
