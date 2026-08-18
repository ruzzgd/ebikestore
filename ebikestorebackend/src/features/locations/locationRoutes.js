import { Router } from 'express';
import locationController from './locationController.js';

const router = Router();

// GET /api/v1/locations
router.get('/', locationController.getLocations);
router.get('/:id', locationController.getLocationById);

export default router;
