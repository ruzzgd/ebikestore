import asyncHandler from '../../middleware/asyncHandler.js';
import locationService from './locationService.js';

export const getLocations = asyncHandler(async (req, res) => {
  const locations = await locationService.getAllLocations();
  res.status(200).json({
    status: 'success',
    data: { locations },
  });
});

export const getLocationById = asyncHandler(async (req, res) => {
  const location = await locationService.getLocationById(parseInt(req.params.id, 10));
  res.status(200).json({
    status: 'success',
    data: { location },
  });
});

export default {
  getLocations,
  getLocationById,
};
