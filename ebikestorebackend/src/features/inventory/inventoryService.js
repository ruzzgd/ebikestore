import { getPool } from '../../db/connection.js';
import inventoryRepository from './inventoryRepository.js';
import stockMovementRepository from './stockMovementRepository.js';
import productRepository from '../products/productRepository.js';
import locationRepository from '../locations/locationRepository.js';
import userRepository from '../users/userRepository.js';
import { syncLowStockAlert } from '../notifications/notificationService.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';

export const MOVEMENT_TYPES = Object.freeze(['stock_in', 'stock_out', 'adjustment_in', 'adjustment_out', 'transfer_out', 'transfer_in']);

export const deriveAvailability = (quantity, threshold) => {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= threshold) return 'limited_stock';
  return 'available';
};

const parsePositiveInteger = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new BadRequestError(`${fieldName} must be a positive integer`);
  return parsed;
};

const parseNonnegativeInteger = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new BadRequestError(`${fieldName} must be a non-negative integer`);
  return parsed;
};

const getActor = async (authUser) => {
  const actor = await userRepository.findUserById(authUser.userId);
  if (!actor || !actor.is_active) throw new UnauthorizedError('Active user account required');
  if (!['admin', 'branch_staff', 'warehouse_staff'].includes(actor.role)) {
    throw new ForbiddenError('Customers cannot access inventory management');
  }
  if (actor.role !== 'admin' && !actor.location_id) {
    throw new ForbiddenError('Staff account has no assigned operating location');
  }
  return actor;
};

const resolveLocationAccess = (actor, requestedLocationId, { required = false } = {}) => {
  const parsed = requestedLocationId === null || requestedLocationId === undefined || requestedLocationId === ''
    ? null : Number(requestedLocationId);
  if (parsed !== null && (!Number.isInteger(parsed) || parsed <= 0)) throw new BadRequestError('locationId must be a positive integer');
  if (actor.role === 'admin') {
    if (required && !parsed) throw new BadRequestError('locationId is required');
    return parsed;
  }
  if (parsed && parsed !== actor.location_id) throw new ForbiddenError('Staff may only access their assigned location');
  return actor.location_id;
};

const validateTarget = async (productIdValue, locationIdValue, actor) => {
  const productId = parsePositiveInteger(productIdValue, 'productId');
  const locationId = resolveLocationAccess(actor, locationIdValue, { required: true });
  const [product, location] = await Promise.all([
    productRepository.findProductById(productId),
    locationRepository.findLocationById(locationId),
  ]);
  if (!product) throw new NotFoundError('Product not found');
  if (!product.is_active) throw new BadRequestError('Stock operations require an active product');
  if (!location) throw new NotFoundError('Location not found');
  if (!location.is_active) throw new BadRequestError('Stock operations require an active location');
  if (actor.role === 'branch_staff' && location.type !== 'branch') throw new ForbiddenError('Branch staff may only operate branch inventory');
  if (actor.role === 'warehouse_staff' && location.type !== 'warehouse') throw new ForbiddenError('Warehouse staff may only operate warehouse inventory');
  return { productId, locationId };
};

export const getInventory = async (authUser, filters = {}) => {
  const actor = await getActor(authUser);
  const locationId = resolveLocationAccess(actor, filters.locationId);
  const productId = filters.productId ? parsePositiveInteger(filters.productId, 'productId') : null;
  return inventoryRepository.listInventory({ locationId, productId, search: filters.search || '', lowStockOnly: Boolean(filters.lowStockOnly) });
};

export const getInventoryByProductAndLocation = async (authUser, productIdValue, locationIdValue) => {
  const actor = await getActor(authUser);
  const productId = parsePositiveInteger(productIdValue, 'productId');
  const locationId = resolveLocationAccess(actor, locationIdValue, { required: true });
  const inventory = await inventoryRepository.findByProductAndLocation(productId, locationId);
  if (!inventory) throw new NotFoundError('Inventory is not configured for this product and location');
  return inventory;
};

export const stockOutInTransaction = async (connection, {
  productId, locationId, quantity, performedByUserId, note = null,
  referenceType = null, referenceId = null,
}) => {
  const inventory = await inventoryRepository.lockByProductAndLocation(connection, productId, locationId);
  if (!inventory) throw new ConflictError('Inventory is not configured for this product and location');
  const quantityBefore = Number(inventory.quantity);
  if (quantity > quantityBefore) throw new ConflictError(`Insufficient stock: ${quantityBefore} available, ${quantity} requested`);
  const quantityAfter = quantityBefore - quantity;
  await inventoryRepository.updateQuantity(connection, inventory.id, quantityAfter);
  await stockMovementRepository.createMovement(connection, {
    productId, locationId, type: 'stock_out', quantity, quantityBefore, quantityAfter,
    referenceType, referenceId, note, performedByUserId,
  });
  await syncLowStockAlert(connection, inventory.id, quantityAfter);
  return { inventoryId: inventory.id, quantityBefore, quantityAfter };
};

const changeStock = async ({ authUser, productId: productIdValue, locationId: locationIdValue, quantity: quantityValue, note, type }) => {
  const actor = await getActor(authUser);
  const quantity = parsePositiveInteger(quantityValue, 'quantity');
  const { productId, locationId } = await validateTarget(productIdValue, locationIdValue, actor);
  const cleanNote = note === undefined || note === null ? null : String(note).trim();
  if (cleanNote && cleanNote.length > 1000) throw new BadRequestError('note cannot exceed 1000 characters');

  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    if (type === 'stock_in') await inventoryRepository.ensureInventoryRow(connection, productId, locationId);
    if (type === 'stock_out') {
      await stockOutInTransaction(connection, {
        productId, locationId, quantity, note: cleanNote, performedByUserId: actor.id,
      });
      await connection.commit();
      return await inventoryRepository.findByProductAndLocation(productId, locationId);
    }
    const inventory = await inventoryRepository.lockByProductAndLocation(connection, productId, locationId);
    if (!inventory) throw new ConflictError('Inventory is not configured; perform stock-in before stock-out');
    const quantityBefore = Number(inventory.quantity);
    const quantityAfter = quantityBefore + quantity;
    await inventoryRepository.updateQuantity(connection, inventory.id, quantityAfter);
    await stockMovementRepository.createMovement(connection, {
      productId, locationId, type: 'stock_in', quantity, quantityBefore, quantityAfter,
      note: cleanNote, performedByUserId: actor.id,
    });
    await syncLowStockAlert(connection, inventory.id, quantityAfter);
    await connection.commit();
    return await inventoryRepository.findByProductAndLocation(productId, locationId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const stockIn = async (authUser, data) => changeStock({ authUser, ...data, type: 'stock_in' });
export const stockOut = async (authUser, data) => changeStock({ authUser, ...data, type: 'stock_out' });

export const setLowStockThreshold = async (authUser, inventoryIdValue, thresholdValue) => {
  const actor = await getActor(authUser);
  const inventoryId = parsePositiveInteger(inventoryIdValue, 'inventoryId');
  const threshold = parseNonnegativeInteger(thresholdValue, 'lowStockThreshold');
  const inventory = await inventoryRepository.findInventoryById(inventoryId);
  if (!inventory) throw new NotFoundError('Inventory record not found');
  resolveLocationAccess(actor, inventory.location_id, { required: true });
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const lockedInventory = await inventoryRepository.lockById(connection, inventoryId);
    if (!lockedInventory) throw new NotFoundError('Inventory record not found');
    await inventoryRepository.updateThresholdInTransaction(connection, inventoryId, threshold);
    await syncLowStockAlert(connection, inventoryId, Number(lockedInventory.quantity));
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
  return inventoryRepository.findInventoryById(inventoryId);
};

export const getMovements = async (authUser, filters = {}) => {
  const actor = await getActor(authUser);
  const locationId = resolveLocationAccess(actor, filters.locationId);
  const productId = filters.productId ? parsePositiveInteger(filters.productId, 'productId') : null;
  if (filters.type && !MOVEMENT_TYPES.includes(filters.type)) throw new BadRequestError('Invalid movement type');
  return stockMovementRepository.listMovements({ ...filters, locationId, productId });
};

export default { deriveAvailability, getInventory, getInventoryByProductAndLocation, stockOutInTransaction, stockIn, stockOut, setLowStockThreshold, getMovements };
