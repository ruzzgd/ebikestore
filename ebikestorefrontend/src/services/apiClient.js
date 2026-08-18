// Retrieve base API URL from Vite environment variable or fall back to /api/v1 (or http://localhost:5000/api/v1)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let csrfToken = null;

export async function fetchCsrfToken() {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch(`${API_BASE_URL}/csrf-token`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.data && data.data.csrfToken) {
        csrfToken = data.data.csrfToken;
      }
    }
  } catch (err) {
    console.error('Failed to fetch CSRF token', err);
  }
  return csrfToken;
}

export function clearCsrfToken() {
  csrfToken = null;
}


/**
 * Reusable HTTP Request Client Foundation
 * @param {string} endpoint - API path relative to base URL (e.g. '/health')
 * @param {object} [options] - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const config = {
    method: options.method || 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method.toUpperCase());
  if (isMutating) {
    const token = await fetchCsrfToken();
    if (token) {
      config.headers['X-CSRF-Token'] = token;
    }
  }

  if (endpoint.includes('/auth/logout')) {
    clearCsrfToken();
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      const error = new Error(data.message || `HTTP request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    if (!contentType?.includes('application/json')) {
      throw new Error('The API returned an unexpected response. Check the frontend API URL configuration.');
    }

    return data;
  } catch (error) {
    console.error(`[API CLIENT ERROR] ${config.method} ${url}:`, error.message);
    throw error;
  }
}

export default apiClient;
