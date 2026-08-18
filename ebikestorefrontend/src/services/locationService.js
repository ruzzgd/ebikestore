import apiClient from './apiClient.js';

export async function getLocations() {
  const response = await apiClient('/locations');
  return response.data?.locations || [];
}

export async function getLocationById(id) {
  const response = await apiClient(`/locations/${id}`);
  return response.data?.location;
}

export default {
  getLocations,
  getLocationById,
};
