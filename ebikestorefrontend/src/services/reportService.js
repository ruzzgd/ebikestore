import apiClient from './apiClient';

const buildQueryString = (filters) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

export const getOverviewStats = async (filters = {}) => {
  return apiClient(`/reports/overview${buildQueryString(filters)}`);
};

export const getInventoryReport = async (filters = {}) => {
  return apiClient(`/reports/inventory${buildQueryString(filters)}`);
};

export const getMovementsReport = async (filters = {}) => {
  return apiClient(`/reports/movements${buildQueryString(filters)}`);
};

export const getTransactionsReport = async (filters = {}) => {
  return apiClient(`/reports/transactions${buildQueryString(filters)}`);
};

export const getTransfersReport = async (filters = {}) => {
  return apiClient(`/reports/transfers${buildQueryString(filters)}`);
};

export const getApplicationsReport = async (filters = {}) => {
  return apiClient(`/reports/applications${buildQueryString(filters)}`);
};

export default {
  getOverviewStats,
  getInventoryReport,
  getMovementsReport,
  getTransactionsReport,
  getTransfersReport,
  getApplicationsReport,
};
