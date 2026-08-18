import apiClient from './apiClient.js';

export async function getCategories(activeOnly = false) {
  const query = activeOnly ? '?activeOnly=true' : '';
  const response = await apiClient(`/categories${query}`);
  return response.data?.categories || [];
}

export async function createCategory(data) {
  const response = await apiClient('/categories', {
    method: 'POST',
    body: data,
  });
  return response.data?.category;
}

export async function updateCategory(id, data) {
  const response = await apiClient(`/categories/${id}`, {
    method: 'PUT',
    body: data,
  });
  return response.data?.category;
}

export async function toggleCategoryActive(id, isActive) {
  const response = await apiClient(`/categories/${id}/active`, {
    method: 'PATCH',
    body: { isActive },
  });
  return response.data?.category;
}

export default {
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryActive,
};
