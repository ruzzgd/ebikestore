import asyncHandler from '../../middleware/asyncHandler.js';
import requestService from './interBranchRequestService.js';

export const createRequest = asyncHandler(async (req, res) => {
  const request = await requestService.createRequest(req.user, req.body);
  res.status(201).json({ status: 'success', data: { request } });
});

export const listRequests = asyncHandler(async (req, res) => {
  const requests = await requestService.listRequests(req.user, {
    status: req.query.status || null,
    sourceLocationId: req.query.sourceLocationId || null,
    destinationLocationId: req.query.destinationLocationId || null,
    limit: req.query.limit || 100,
    offset: req.query.offset || 0,
  });
  res.status(200).json({ status: 'success', data: { requests } });
});

export const getRequest = asyncHandler(async (req, res) => {
  const request = await requestService.getRequest(req.user, req.params.id);
  res.status(200).json({ status: 'success', data: { request } });
});

export const listSourceInventory = asyncHandler(async (req, res) => {
  const inventory = await requestService.listSourceInventory(req.user, req.params.locationId);
  res.status(200).json({ status: 'success', data: { inventory } });
});

const action = (serviceAction) => asyncHandler(async (req, res) => {
  const request = await serviceAction(req.user, req.params.id, req.body.password);
  res.status(200).json({ status: 'success', data: { request } });
});

export const approveRequest = action(requestService.approveRequest);
export const rejectRequest = action(requestService.rejectRequest);
export const dispatchRequest = action(requestService.dispatchRequest);
export const receiveRequest = action(requestService.receiveRequest);

export default { createRequest, listRequests, getRequest, listSourceInventory, approveRequest, rejectRequest, dispatchRequest, receiveRequest };
