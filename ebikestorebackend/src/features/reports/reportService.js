import reportRepository from './reportRepository.js';
import userRepository from '../users/userRepository.js';
import { UnauthorizedError, ForbiddenError, BadRequestError } from '../../utils/errors.js';

const getActor = async (authUser) => {
  const actor = await userRepository.findUserById(authUser.userId);
  if (!actor || !actor.is_active) throw new UnauthorizedError('Active user account required');
  if (!['admin', 'branch_staff', 'warehouse_staff'].includes(actor.role)) {
    throw new ForbiddenError('Customers cannot access reports');
  }
  if (actor.role !== 'admin' && !actor.location_id) {
    throw new ForbiddenError('Staff account has no assigned operating location');
  }
  return actor;
};

const resolveLocationAccess = (actor, requestedLocationId) => {
  const parsed = requestedLocationId ? Number(requestedLocationId) : null;
  if (parsed !== null && (!Number.isInteger(parsed) || parsed <= 0)) {
    throw new BadRequestError('locationId must be a positive integer');
  }
  
  if (actor.role === 'admin') {
    return parsed;
  }
  
  // Staff are restricted to their assigned location
  if (parsed && parsed !== actor.location_id) {
    throw new ForbiddenError('Staff may only access their assigned location reports');
  }
  return actor.location_id;
};

const resolveDateRange = (startDateStr, endDateStr) => {
  // default to last 30 days
  const end = endDateStr ? new Date(endDateStr) : new Date();
  const start = startDateStr ? new Date(startDateStr) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new BadRequestError('Invalid date format');
  }

  if (start > end) {
    throw new BadRequestError('startDate must be before or equal to endDate');
  }

  // Adjust end date to cover the entire day
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);

  return { startDate: start, endDate: end };
};

const checkWarehouseAppAccess = (actor, endpointType) => {
  if (actor.role === 'warehouse_staff' && ['transactions', 'applications'].includes(endpointType)) {
    throw new ForbiddenError('Warehouse staff cannot access customer application reports');
  }
};

export const getOverview = async (authUser, filters = {}) => {
  const actor = await getActor(authUser);
  const locationId = resolveLocationAccess(actor, filters.locationId);
  const { startDate, endDate } = resolveDateRange(filters.startDate, filters.endDate);
  
  const stats = await reportRepository.getOverviewStats({ locationId, startDate, endDate });

  // If warehouse, zeroes out transaction metrics just to be safe
  if (actor.role === 'warehouse_staff') {
    stats.completedTransactions = 0;
    stats.applicationsAwaitingReview = 0;
  }

  return stats;
};

export const getInventory = async (authUser, filters = {}) => {
  const actor = await getActor(authUser);
  const locationId = resolveLocationAccess(actor, filters.locationId);
  
  return reportRepository.getInventoryReport({
    locationId,
    categoryId: filters.categoryId ? Number(filters.categoryId) : null,
    search: filters.search || '',
    lowStockOnly: Boolean(filters.lowStockOnly === 'true' || filters.lowStockOnly === true)
  });
};

export const getMovements = async (authUser, filters = {}) => {
  const actor = await getActor(authUser);
  const locationId = resolveLocationAccess(actor, filters.locationId);
  const { startDate, endDate } = resolveDateRange(filters.startDate, filters.endDate);
  
  return reportRepository.getMovementReport({
    locationId,
    startDate,
    endDate,
    type: filters.type || null,
    limit: filters.limit ? Number(filters.limit) : 500,
    offset: filters.offset ? Number(filters.offset) : 0,
  });
};

export const getTransactions = async (authUser, filters = {}) => {
  const actor = await getActor(authUser);
  checkWarehouseAppAccess(actor, 'transactions');
  const locationId = resolveLocationAccess(actor, filters.locationId);
  const { startDate, endDate } = resolveDateRange(filters.startDate, filters.endDate);
  
  return reportRepository.getTransactionReport({
    locationId,
    startDate,
    endDate,
    limit: filters.limit ? Number(filters.limit) : 500,
    offset: filters.offset ? Number(filters.offset) : 0,
  });
};

export const getTransfers = async (authUser, filters = {}) => {
  const actor = await getActor(authUser);
  const locationId = resolveLocationAccess(actor, filters.locationId);
  const { startDate, endDate } = resolveDateRange(filters.startDate, filters.endDate);
  
  return reportRepository.getTransferReport({
    locationId,
    startDate,
    endDate,
    status: filters.status || null,
    limit: filters.limit ? Number(filters.limit) : 500,
    offset: filters.offset ? Number(filters.offset) : 0,
  });
};

export const getApplications = async (authUser, filters = {}) => {
  const actor = await getActor(authUser);
  checkWarehouseAppAccess(actor, 'applications');
  const locationId = resolveLocationAccess(actor, filters.locationId);
  const { startDate, endDate } = resolveDateRange(filters.startDate, filters.endDate);
  
  return reportRepository.getApplicationReport({
    locationId,
    startDate,
    endDate,
    status: filters.status || null,
    limit: filters.limit ? Number(filters.limit) : 500,
    offset: filters.offset ? Number(filters.offset) : 0,
  });
};

export default {
  getOverview,
  getInventory,
  getMovements,
  getTransactions,
  getTransfers,
  getApplications,
};
