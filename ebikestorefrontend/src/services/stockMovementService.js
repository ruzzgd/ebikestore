import apiClient from './apiClient.js';

export async function getMovements(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') params.append(key, value);
  });
  const suffix = params.toString() ? `?${params}` : '';
  const response = await apiClient(`/inventory/movements${suffix}`);
  return response.data?.movements || [];
}

export default { getMovements };
