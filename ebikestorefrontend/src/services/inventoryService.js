import apiClient from './apiClient.js';

const queryString = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') params.append(key, value);
  });
  return params.toString() ? `?${params}` : '';
};

export async function getInventory(filters = {}) {
  const response = await apiClient(`/inventory${queryString(filters)}`);
  return response.data?.inventory || [];
}

export async function getLowStock(filters = {}) {
  const response = await apiClient(`/inventory/low-stock${queryString(filters)}`);
  return response.data?.inventory || [];
}

export async function stockIn(data) {
  const response = await apiClient('/inventory/stock-in', { method: 'POST', body: data });
  return response.data?.inventory;
}

export async function stockOut(data) {
  const response = await apiClient('/inventory/stock-out', { method: 'POST', body: data });
  return response.data?.inventory;
}

export async function updateThreshold(id, lowStockThreshold) {
  const response = await apiClient(`/inventory/${id}/threshold`, {
    method: 'PATCH', body: { lowStockThreshold },
  });
  return response.data?.inventory;
}

export default { getInventory, getLowStock, stockIn, stockOut, updateThreshold };
