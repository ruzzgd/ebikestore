import asyncHandler from '../../middleware/asyncHandler.js';
import { getSystemHealth } from './healthService.js';

export const getHealth = asyncHandler(async (req, res) => {
  const healthData = await getSystemHealth();
  const statusCode = healthData.status === 'ok' ? 200 : 503;
  res.status(statusCode).json({
    status: 'success',
    data: healthData,
  });
});

export default {
  getHealth,
};
