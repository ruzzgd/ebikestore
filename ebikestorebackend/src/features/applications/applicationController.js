import asyncHandler from '../../middleware/asyncHandler.js';
import applicationService from './applicationService.js';

export const createApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.createApplication(req.user, req.body);
  res.status(201).json({ status: 'success', data: { application } });
});

export const listMyApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.listMyApplications(req.user, req.query);
  res.status(200).json({ status: 'success', data: { applications } });
});

export const listApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.listManagedApplications(req.user, req.query);
  res.status(200).json({ status: 'success', data: { applications } });
});

export const getApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.getApplication(req.user, req.params.id);
  res.status(200).json({ status: 'success', data: { application } });
});

const action = (handler) => asyncHandler(async (req, res) => {
  const application = await handler(req.user, req.params.id, req.body.rejectionReason);
  res.status(200).json({ status: 'success', data: { application } });
});

export const startReview = action(applicationService.startReview);
export const approveApplication = action(applicationService.approveApplication);
export const rejectApplication = action(applicationService.rejectApplication);
export const cancelApplication = action(applicationService.cancelApplication);

export const completeApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.completeApplication(req.user, req.params.id, req.body.password);
  res.status(200).json({ status: 'success', data: { application } });
});

export default { createApplication, listMyApplications, listApplications, getApplication, startReview, approveApplication, rejectApplication, cancelApplication, completeApplication };
