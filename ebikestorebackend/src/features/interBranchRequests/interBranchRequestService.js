import crypto from 'crypto';
import { getPool } from '../../db/connection.js';
import requestRepository from './interBranchRequestRepository.js';
import inventoryRepository from '../inventory/inventoryRepository.js';
import stockMovementRepository from '../inventory/stockMovementRepository.js';
import userRepository from '../users/userRepository.js';
import locationRepository from '../locations/locationRepository.js';
import productRepository from '../products/productRepository.js';
import { createForUsers, getAdminIds, getLocationStaffIds, getRecipientsForLocation, syncLowStockAlert } from '../notifications/notificationService.js';
import { verifyCurrentPassword } from '../auth/authService.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';

export const REQUEST_STATUSES = Object.freeze(['pending', 'approved', 'rejected', 'in_transit', 'received']);
export const ALLOWED_TRANSITIONS = Object.freeze({
  pending: Object.freeze(['approved', 'rejected']),
  approved: Object.freeze(['in_transit']),
  rejected: Object.freeze([]),
  in_transit: Object.freeze(['received']),
  received: Object.freeze([]),
});

export const isTransitionAllowed = (currentStatus, nextStatus) => Boolean(ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus));

export const generateRequestReference = (date = new Date()) => {
  const year = date.getFullYear();
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `REQ-${year}-${suffix}`;
};

const parsePositiveInteger = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new BadRequestError(`${fieldName} must be a positive integer`);
  return parsed;
};

const getActor = async (authUser) => {
  const actor = await userRepository.findUserById(authUser.userId);
  if (!actor || !actor.is_active) throw new UnauthorizedError('Active user account required');
  if (!['admin', 'branch_staff', 'warehouse_staff'].includes(actor.role)) throw new ForbiddenError('Customers cannot access inter-branch requests');
  if (actor.role !== 'admin' && !actor.location_id) throw new ForbiddenError('Staff account has no assigned location');
  return actor;
};

const assertStaffLocationType = (actor, location) => {
  if (actor.role === 'branch_staff' && location.type !== 'branch') throw new ForbiddenError('Branch staff must be assigned to a branch');
  if (actor.role === 'warehouse_staff' && location.type !== 'warehouse') throw new ForbiddenError('Warehouse staff must be assigned to a warehouse');
};

const assertRequestVisible = (actor, request) => {
  if (actor.role !== 'admin' && actor.location_id !== request.source_location_id && actor.location_id !== request.destination_location_id) {
    throw new ForbiddenError('This request is outside your assigned location');
  }
};

const validateLockedRequest = (request, expectedStatus, nextStatus) => {
  if (!request) throw new NotFoundError('Inter-branch request not found');
  if (request.status !== expectedStatus || !isTransitionAllowed(request.status, nextStatus)) {
    throw new ConflictError(`Request cannot transition from '${request.status}' to '${nextStatus}'`);
  }
};

const validateLockedLocations = (locations, sourceId, destinationId) => {
  const source = locations.find((location) => location.id === sourceId);
  const destination = locations.find((location) => location.id === destinationId);
  if (!source || !destination) throw new NotFoundError('Source or destination location no longer exists');
  if (!source.is_active || !destination.is_active) throw new ConflictError('Source and destination locations must remain active');
};

const getRequestDetailUnchecked = async (id) => {
  const request = await requestRepository.findRequestById(id);
  if (!request) throw new NotFoundError('Inter-branch request not found');
  const items = await requestRepository.listItems(id);
  return { ...request, items };
};

export const createRequest = async (authUser, data) => {
  const actor = await getActor(authUser);
  const sourceLocationId = parsePositiveInteger(data.sourceLocationId ?? data.source_location_id, 'sourceLocationId');
  const submittedDestination = parsePositiveInteger(data.destinationLocationId ?? data.destination_location_id, 'destinationLocationId');
  const destinationLocationId = actor.role === 'admin' ? submittedDestination : actor.location_id;
  if (actor.role !== 'admin' && submittedDestination !== actor.location_id) throw new ForbiddenError('Staff may only request stock for their assigned destination');
  if (sourceLocationId === destinationLocationId) throw new BadRequestError('Source and destination locations must be different');
  if (!Array.isArray(data.items) || data.items.length === 0) throw new BadRequestError('At least one request item is required');
  const items = data.items.map((item) => ({
    productId: parsePositiveInteger(item.productId ?? item.product_id, 'productId'),
    quantityRequested: parsePositiveInteger(item.quantityRequested ?? item.quantity_requested, 'quantityRequested'),
  }));
  if (new Set(items.map((item) => item.productId)).size !== items.length) throw new BadRequestError('Duplicate products are not allowed in one request');
  const note = data.note === undefined || data.note === null ? null : String(data.note).trim();
  if (note && note.length > 1000) throw new BadRequestError('note cannot exceed 1000 characters');

  const requestedDeliveryDate = data.requestedDeliveryDate ?? data.requested_delivery_date;
  if (!requestedDeliveryDate) throw new BadRequestError('requestedDeliveryDate is required');
  const parsedDate = new Date(requestedDeliveryDate);
  if (isNaN(parsedDate.getTime())) throw new BadRequestError('Invalid requestedDeliveryDate format');
  // Check if date is in the past (ignoring time by resetting to midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const requestedMidnight = new Date(parsedDate);
  requestedMidnight.setHours(0, 0, 0, 0);
  if (requestedMidnight < today) throw new BadRequestError('requestedDeliveryDate cannot be in the past');

  const reasonForTransfer = data.reasonForTransfer ?? data.reason_for_transfer;
  const reason = reasonForTransfer === undefined || reasonForTransfer === null ? null : String(reasonForTransfer).trim();
  if (reason && reason.length > 500) throw new BadRequestError('reasonForTransfer cannot exceed 500 characters');

  const [source, destination, ...products] = await Promise.all([
    locationRepository.findLocationById(sourceLocationId),
    locationRepository.findLocationById(destinationLocationId),
    ...items.map((item) => productRepository.findProductById(item.productId)),
  ]);
  if (!source || !destination) throw new NotFoundError('Source or destination location does not exist');
  if (!source.is_active || !destination.is_active) throw new BadRequestError('Source and destination locations must be active');
  assertStaffLocationType(actor, destination);
  products.forEach((product) => {
    if (!product) throw new NotFoundError('A requested product does not exist');
    if (!product.is_active) throw new BadRequestError(`Product '${product.name}' is inactive`);
  });

  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const requestReference = generateRequestReference();
    const requestId = await requestRepository.createRequest(connection, {
      requestReference, sourceLocationId, destinationLocationId,
      requestedByUserId: actor.id, note,
      requestedDeliveryDate: parsedDate.toISOString().split('T')[0], reasonForTransfer: reason,
    });
    await requestRepository.createItems(connection, requestId, items);
    const recipients = await getRecipientsForLocation(connection, sourceLocationId, { includeAdmins: true });
    await createForUsers(connection, recipients, {
      type: 'transfer_requested', title: 'New transfer request',
      message: `${requestReference} requests stock from ${source.name} for ${destination.name}.`,
      referenceType: 'inter_branch_request', referenceId: String(requestId),
    });
    await connection.commit();
    return getRequestDetailUnchecked(requestId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
};

export const listRequests = async (authUser, filters = {}) => {
  const actor = await getActor(authUser);
  if (filters.status && !REQUEST_STATUSES.includes(filters.status)) throw new BadRequestError('Invalid request status');
  return requestRepository.listRequests({
    actorLocationId: actor.role === 'admin' ? null : actor.location_id,
    status: filters.status || null,
    sourceLocationId: filters.sourceLocationId ? parsePositiveInteger(filters.sourceLocationId, 'sourceLocationId') : null,
    destinationLocationId: filters.destinationLocationId ? parsePositiveInteger(filters.destinationLocationId, 'destinationLocationId') : null,
    limit: filters.limit, offset: filters.offset,
  });
};

export const getRequest = async (authUser, idValue) => {
  const actor = await getActor(authUser);
  const detail = await getRequestDetailUnchecked(parsePositiveInteger(idValue, 'requestId'));
  assertRequestVisible(actor, detail);
  return detail;
};

const runStatusTransaction = async (idValue, callback) => {
  const requestId = parsePositiveInteger(idValue, 'requestId');
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    await callback(connection, requestId);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
  return getRequestDetailUnchecked(requestId);
};

export const approveRequest = async (authUser, idValue, password) => {
  const actor = await getActor(authUser);
  await verifyCurrentPassword(authUser.userId, password);
  return runStatusTransaction(idValue, async (connection, requestId) => {
    const request = await requestRepository.lockRequestById(connection, requestId);
    if (actor.role !== 'admin' && actor.location_id !== request.source_location_id) {
      throw new ForbiddenError('Only administrators or source-location staff may approve requests');
    }
    validateLockedRequest(request, 'pending', 'approved');
    const locations = await requestRepository.lockLocations(connection, [request.source_location_id, request.destination_location_id]);
    validateLockedLocations(locations, request.source_location_id, request.destination_location_id);
    const items = await requestRepository.listItemsForUpdate(connection, requestId);
    for (const item of items) {
      if (!item.product_is_active) throw new ConflictError(`Product '${item.product_name}' is inactive`);
      const inventory = await inventoryRepository.lockByProductAndLocation(connection, item.product_id, request.source_location_id);
      if (!inventory || Number(inventory.quantity) < item.quantity_requested) throw new ConflictError(`Insufficient source stock for '${item.product_name}'`);
    }
    await requestRepository.updateStatus(connection, requestId, 'approved', actor.id);
    const recipients = [request.requested_by_user_id, ...(await getLocationStaffIds(connection, request.destination_location_id))];
    await createForUsers(connection, recipients, {
      type: 'transfer_approved', title: 'Transfer request approved',
      message: `${request.request_reference} has been approved and is ready for dispatch.`,
      referenceType: 'inter_branch_request', referenceId: String(request.id),
    });
  });
};

export const rejectRequest = async (authUser, idValue, password) => {
  const actor = await getActor(authUser);
  await verifyCurrentPassword(authUser.userId, password);
  return runStatusTransaction(idValue, async (connection, requestId) => {
    const request = await requestRepository.lockRequestById(connection, requestId);
    if (actor.role !== 'admin' && actor.location_id !== request.source_location_id) {
      throw new ForbiddenError('Only administrators or source-location staff may reject requests');
    }
    validateLockedRequest(request, 'pending', 'rejected');
    await requestRepository.updateStatus(connection, requestId, 'rejected', actor.id);
    await createForUsers(connection, [request.requested_by_user_id], {
      type: 'transfer_rejected', title: 'Transfer request rejected',
      message: `${request.request_reference} has been rejected.`,
      referenceType: 'inter_branch_request', referenceId: String(request.id),
    });
  });
};

export const dispatchRequest = async (authUser, idValue, password) => {
  const actor = await getActor(authUser);
  await verifyCurrentPassword(authUser.userId, password);
  return runStatusTransaction(idValue, async (connection, requestId) => {
    const request = await requestRepository.lockRequestById(connection, requestId);
    validateLockedRequest(request, 'approved', 'in_transit');
    if (actor.role !== 'admin' && actor.location_id !== request.source_location_id) throw new ForbiddenError('Only source-location staff may dispatch this request');
    const locations = await requestRepository.lockLocations(connection, [request.source_location_id, request.destination_location_id]);
    validateLockedLocations(locations, request.source_location_id, request.destination_location_id);
    const items = await requestRepository.listItemsForUpdate(connection, requestId);
    const lockedInventory = [];
    for (const item of items) {
      if (!item.product_is_active) throw new ConflictError(`Product '${item.product_name}' is inactive`);
      const inventory = await inventoryRepository.lockByProductAndLocation(connection, item.product_id, request.source_location_id);
      if (!inventory || Number(inventory.quantity) < item.quantity_requested) throw new ConflictError(`Insufficient source stock for '${item.product_name}'`);
      lockedInventory.push({ item, inventory });
    }
    for (const { item, inventory } of lockedInventory) {
      const before = Number(inventory.quantity);
      const after = before - item.quantity_requested;
      await inventoryRepository.updateQuantity(connection, inventory.id, after);
      await stockMovementRepository.createMovement(connection, {
        productId: item.product_id, locationId: request.source_location_id, type: 'transfer_out',
        quantity: item.quantity_requested, quantityBefore: before, quantityAfter: after,
        referenceType: 'inter_branch_request', referenceId: String(request.id),
        note: `Dispatched via ${request.request_reference}`, performedByUserId: actor.id,
      });
      await syncLowStockAlert(connection, inventory.id, after);
      await requestRepository.markItemDispatched(connection, item.id, item.quantity_requested);
    }
    await requestRepository.updateStatus(connection, requestId, 'in_transit', actor.id);
    const recipients = [request.requested_by_user_id, ...(await getLocationStaffIds(connection, request.destination_location_id))];
    await createForUsers(connection, recipients, {
      type: 'transfer_dispatched', title: 'Transfer dispatched',
      message: `${request.request_reference} is now in transit to its destination.`,
      referenceType: 'inter_branch_request', referenceId: String(request.id),
    });
  });
};

export const receiveRequest = async (authUser, idValue, password) => {
  const actor = await getActor(authUser);
  await verifyCurrentPassword(authUser.userId, password);
  return runStatusTransaction(idValue, async (connection, requestId) => {
    const request = await requestRepository.lockRequestById(connection, requestId);
    validateLockedRequest(request, 'in_transit', 'received');
    if (actor.role !== 'admin' && actor.location_id !== request.destination_location_id) throw new ForbiddenError('Only destination-location staff may receive this request');
    const locations = await requestRepository.lockLocations(connection, [request.source_location_id, request.destination_location_id]);
    validateLockedLocations(locations, request.source_location_id, request.destination_location_id);
    const items = await requestRepository.listItemsForUpdate(connection, requestId);
    const lockedInventory = [];
    for (const item of items) {
      if (item.quantity_dispatched !== item.quantity_requested || item.quantity_dispatched <= 0) throw new ConflictError(`Item '${item.product_name}' was not fully dispatched`);
      await inventoryRepository.ensureInventoryRow(connection, item.product_id, request.destination_location_id);
      const inventory = await inventoryRepository.lockByProductAndLocation(connection, item.product_id, request.destination_location_id);
      lockedInventory.push({ item, inventory });
    }
    for (const { item, inventory } of lockedInventory) {
      const before = Number(inventory.quantity);
      const after = before + item.quantity_dispatched;
      await inventoryRepository.updateQuantity(connection, inventory.id, after);
      await stockMovementRepository.createMovement(connection, {
        productId: item.product_id, locationId: request.destination_location_id, type: 'transfer_in',
        quantity: item.quantity_dispatched, quantityBefore: before, quantityAfter: after,
        referenceType: 'inter_branch_request', referenceId: String(request.id),
        note: `Received via ${request.request_reference}`, performedByUserId: actor.id,
      });
      await syncLowStockAlert(connection, inventory.id, after);
      await requestRepository.markItemReceived(connection, item.id, item.quantity_dispatched);
    }
    await requestRepository.updateStatus(connection, requestId, 'received', actor.id);
    const recipients = [request.requested_by_user_id, ...(await getLocationStaffIds(connection, request.source_location_id)), ...(await getAdminIds(connection))];
    await createForUsers(connection, recipients, {
      type: 'transfer_received', title: 'Transfer received',
      message: `${request.request_reference} has been received at its destination.`,
      referenceType: 'inter_branch_request', referenceId: String(request.id),
    });
  });
};

export default { createRequest, listRequests, getRequest, approveRequest, rejectRequest, dispatchRequest, receiveRequest };
