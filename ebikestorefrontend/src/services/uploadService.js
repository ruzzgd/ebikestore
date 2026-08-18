import apiClient from './apiClient.js';

export async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient('/uploads/product-image', {
    method: 'POST',
    body: formData,
  });

  return response.data; // { imageKey, imageUrl }
}

export default {
  uploadProductImage,
};
