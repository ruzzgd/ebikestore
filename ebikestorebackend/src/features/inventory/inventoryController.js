import asyncHandler from '../../middleware/asyncHandler.js';
import inventoryService from './inventoryService.js';

const filtersFromQuery = (query) => ({
  locationId: query.locationId || null,
  productId: query.productId || null,
  search: query.search || '',
  type: query.type || null,
  userId: query.userId || null,
  dateFrom: query.dateFrom || null,
  dateTo: query.dateTo || null,
  limit: query.limit || 100,
  offset: query.offset || 0,
  archived: query.archived || false,
});

export const listInventory = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.getInventory(req.user, filtersFromQuery(req.query));
  res.status(200).json({ status: 'success', data: { inventory } });
});

export const listLowStock = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.getInventory(req.user, { ...filtersFromQuery(req.query), lowStockOnly: true });
  res.status(200).json({ status: 'success', data: { inventory } });
});

export const getInventoryRecord = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.getInventoryByProductAndLocation(req.user, req.params.productId, req.params.locationId);
  res.status(200).json({ status: 'success', data: { inventory } });
});

export const stockIn = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.stockIn(req.user, req.body);
  res.status(200).json({ status: 'success', data: { inventory } });
});

export const stockOut = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.stockOut(req.user, req.body);
  res.status(200).json({ status: 'success', data: { inventory } });
});

export const walkInSale = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.recordWalkInSale(req.user, req.body);
  res.status(200).json({ status: 'success', data: { inventory } });
});

export const updateArchivedState = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.setArchivedState(req.user, req.params.id, req.body.isArchived);
  res.status(200).json({ status: 'success', data: { inventory } });
});

export const updateThreshold = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.setLowStockThreshold(req.user, req.params.id, req.body.lowStockThreshold);
  res.status(200).json({ status: 'success', data: { inventory } });
});

export const listMovements = asyncHandler(async (req, res) => {
  const movements = await inventoryService.getMovements(req.user, filtersFromQuery(req.query));
  res.status(200).json({ status: 'success', data: { movements } });
});

export default { listInventory, listLowStock, getInventoryRecord, stockIn, stockOut, walkInSale, updateArchivedState, updateThreshold, listMovements };
