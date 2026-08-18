import locationRepository from './locationRepository.js';
import { NotFoundError } from '../../utils/errors.js';

export const getAllLocations = async () => {
  return await locationRepository.listLocations();
};

export const getLocationById = async (id) => {
  const location = await locationRepository.findLocationById(id);
  if (!location) {
    throw new NotFoundError('Location not found');
  }
  return location;
};

export default {
  getAllLocations,
  getLocationById,
};
