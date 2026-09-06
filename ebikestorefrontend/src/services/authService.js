import apiClient from './apiClient.js';

/**
 * Public Customer Registration
 */
export async function register({ name, email, password }) {
  const response = await apiClient('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
  return response.data;
}

/**
 * Verify Email with Code
 */
export async function verifyEmail({ email, code }) {
  const response = await apiClient('/auth/verify-email', {
    method: 'POST',
    body: { email, code },
  });
  return response.data;
}

/**
 * Resend Verification Code
 */
export async function resendVerification({ email }) {
  const response = await apiClient('/auth/resend-verification', {
    method: 'POST',
    body: { email },
  });
  return response.data;
}

export async function requestPasswordReset({ email }) {
  const response = await apiClient('/auth/forgot-password', { method: 'POST', body: { email } });
  return response.data;
}

export async function resetPassword({ email, code, password }) {
  const response = await apiClient('/auth/reset-password', { method: 'POST', body: { email, code, password } });
  return response.data;
}

/**
 * User Login
 */
export async function login({ email, password }) {
  const response = await apiClient('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return response.data;
}

/**
 * User Logout
 */
export async function logout() {
  const response = await apiClient('/auth/logout', {
    method: 'POST',
  });
  return response;
}

/**
 * Get Current User Profile
 */
export async function getCurrentUser() {
  const response = await apiClient('/auth/me');
  return response.data?.user;
}

export async function updateProfile({ name, email }) {
  const response = await apiClient('/auth/me', { method: 'PATCH', body: { name, email } });
  return response.data?.user;
}

export async function updateAvatar(file) {
  const body = new FormData();
  body.append('avatar', file);
  const response = await apiClient('/auth/me/avatar', { method: 'POST', body });
  return response.data?.user;
}

export async function requestPasswordChangeCode() {
  const response = await apiClient('/auth/me/password-code', { method: 'POST' });
  return response.data;
}

export async function changePassword({ code, password }) {
  const response = await apiClient('/auth/me/change-password', { method: 'POST', body: { code, password } });
  return response.data;
}

/**
 * Admin Create Staff Account
 */
export async function createStaffAccount({ name, email, password, role, locationId }) {
  const response = await apiClient('/users/staff', {
    method: 'POST',
    body: { name, email, password, role, locationId },
  });
  return response.data?.user;
}

/**
 * Admin Get User List
 */
export async function listUsers() {
  const response = await apiClient('/users');
  return response.data?.users;
}

export async function updateUserActive(id, isActive, password) {
  const response = await apiClient(`/users/${id}/active`, { method: 'PATCH', body: { isActive, password } });
  return response.data?.user;
}

export async function deleteUser(id, password) {
  const response = await apiClient(`/users/${id}`, { method: 'DELETE', body: { password } });
  return response.data;
}

export default {
  register,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  updateAvatar,
  requestPasswordChangeCode,
  changePassword,
  createStaffAccount,
  listUsers,
  updateUserActive,
  deleteUser,
};
