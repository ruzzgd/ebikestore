import apiClient from './apiClient.js';

const query = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') params.append(key, value);
  });
  return params.toString() ? `?${params}` : '';
};

export async function createApplication(data) {
  const response = await apiClient('/applications', { method: 'POST', body: data });
  return response.data?.application;
}
export async function getMyApplications(filters = {}) {
  const response = await apiClient(`/applications/me${query(filters)}`);
  return response.data?.applications || [];
}
export async function getApplications(filters = {}) {
  const response = await apiClient(`/applications${query(filters)}`);
  return response.data?.applications || [];
}
export async function getApplication(id) {
  const response = await apiClient(`/applications/${id}`);
  return response.data?.application;
}
const transition = async (id, action, body = undefined) => {
  const response = await apiClient(`/applications/${id}/${action}`, { method: 'POST', ...(body && { body }) });
  return response.data?.application;
};
export const startReview = (id) => transition(id, 'review');
export const approveApplication = (id) => transition(id, 'approve');
export const rejectApplication = (id, rejectionReason) => transition(id, 'reject', { rejectionReason });
export const cancelApplication = (id) => transition(id, 'cancel');
export const completeApplication = (id, password) => transition(id, 'complete', typeof password === 'object' ? password : { password });

export default { createApplication, getMyApplications, getApplications, getApplication, startReview, approveApplication, rejectApplication, cancelApplication, completeApplication };
