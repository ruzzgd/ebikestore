import apiClient from './apiClient.js';

/**
 * Fetch backend API and database health status
 * @returns {Promise<object>} Health response payload
 */
export async function getHealthStatus() {
  const response = await apiClient('/health');
  return response.data;
}

export default {
  getHealthStatus,
};
