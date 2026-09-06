import asyncHandler from '../../middleware/asyncHandler.js';
import userService from './userService.js';

export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, role, locationId } = req.body;
  const staff = await userService.createStaffAccount({ name, email, password, role, locationId });
  res.status(201).json({
    status: 'success',
    data: { user: staff },
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit || '50', 10);
  const offset = parseInt(req.query.offset || '0', 10);
  const users = await userService.getAllUsers({ limit, offset });
  res.status(200).json({
    status: 'success',
    data: { users },
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(parseInt(req.params.id, 10));
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

export const updateUserActive = asyncHandler(async (req, res) => {
  const { isActive, password } = req.body;
  const user = await userService.setUserActiveStatus({
    actorId: req.user.userId,
    targetId: parseInt(req.params.id, 10),
    isActive: Boolean(isActive),
    password,
  });
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const result = await userService.deleteUserAccount({
    actorId: req.user.userId,
    targetId: parseInt(req.params.id, 10),
    password,
  });
  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export default {
  createStaff,
  getUsers,
  getUserById,
  updateUserActive,
  deleteUser,
};
