import apiClient from './apiClient.js';

export async function getProducts({ category = null, search = '', activeOnly = false } = {}) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  if (activeOnly) params.append('activeOnly', 'true');

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await apiClient(`/products${queryString}`);
  return response.data?.products || [];
}

export async function getProductById(id) {
  const response = await apiClient(`/products/${id}`);
  return response.data?.product;
}

export async function createProduct(data) {
  const response = await apiClient('/products', {
    method: 'POST',
    body: data,
  });
  return response.data?.product;
}

export async function updateProduct(id, data) {
  const response = await apiClient(`/products/${id}`, {
    method: 'PUT',
    body: data,
  });
  return response.data?.product;
}

export async function toggleProductActive(id, isActive) {
  const response = await apiClient(`/products/${id}/active`, {
    method: 'PATCH',
    body: { isActive },
  });
  return response.data?.product;
}

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductActive,
};
