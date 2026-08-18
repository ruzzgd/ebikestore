import apiClient from './apiClient.js';

const withQuery = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') params.append(key, value);
  });
  return params.toString() ? `?${params}` : '';
};

export async function createRequest(data) {
  const response = await apiClient('/inter-branch-requests', { method: 'POST', body: data });
  return response.data?.request;
}

export async function listRequests(filters = {}) {
  const response = await apiClient(`/inter-branch-requests${withQuery(filters)}`);
  return response.data?.requests || [];
}

export async function getRequest(id) {
  const response = await apiClient(`/inter-branch-requests/${id}`);
  return response.data?.request;
}

const transition = async (id, action, password) => {
  const response = await apiClient(`/inter-branch-requests/${id}/${action}`, { method: 'POST', body: { password } });
  return response.data?.request;
};

export const approveRequest = (id, password) => transition(id, 'approve', password);
export const rejectRequest = (id, password) => transition(id, 'reject', password);
export const dispatchRequest = (id, password) => transition(id, 'dispatch', password);
export const receiveRequest = (id, password) => transition(id, 'receive', password);

export default { createRequest, listRequests, getRequest, approveRequest, rejectRequest, dispatchRequest, receiveRequest };
