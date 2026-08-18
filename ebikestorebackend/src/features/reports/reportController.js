import asyncHandler from '../../middleware/asyncHandler.js';
import reportService from './reportService.js';

export const getOverview = asyncHandler(async (req, res) => {
  const data = await reportService.getOverview(req.user, req.query);
  res.status(200).json({ status: 'success', data });
});

export const getInventory = asyncHandler(async (req, res) => {
  const data = await reportService.getInventory(req.user, req.query);
  res.status(200).json({ status: 'success', data });
});

export const getMovements = asyncHandler(async (req, res) => {
  const data = await reportService.getMovements(req.user, req.query);
  res.status(200).json({ status: 'success', data });
});

export const getTransactions = asyncHandler(async (req, res) => {
  const data = await reportService.getTransactions(req.user, req.query);
  res.status(200).json({ status: 'success', data });
});

export const getTransfers = asyncHandler(async (req, res) => {
  const data = await reportService.getTransfers(req.user, req.query);
  res.status(200).json({ status: 'success', data });
});

export const getApplications = asyncHandler(async (req, res) => {
  const data = await reportService.getApplications(req.user, req.query);
  res.status(200).json({ status: 'success', data });
});

export default {
  getOverview,
  getInventory,
  getMovements,
  getTransactions,
  getTransfers,
  getApplications,
};
