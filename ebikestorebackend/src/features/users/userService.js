import userRepository from './userRepository.js';
import locationRepository from '../locations/locationRepository.js';
import { comparePassword, hashPassword } from '../../utils/crypto.js';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';
import { validateFullName, validateEmail } from '../../utils/validators.js';

/**
 * Admin creation of staff accounts (branch_staff or warehouse_staff)
 */
export const createStaffAccount = async ({ name, email, password, role, locationId }) => {
  if (!name || !email || !password || !role || !locationId) {
    throw new BadRequestError('Name, email, password, role, and location are required for staff creation');
  }

  const cleanName = validateFullName(name, 'Staff name');
  const cleanEmail = validateEmail(email, 'Staff email');

  const allowedStaffRoles = ['branch_staff', 'warehouse_staff'];
  if (!allowedStaffRoles.includes(role)) {
    throw new BadRequestError(`Invalid staff role '${role}'. Admin may only create 'branch_staff' or 'warehouse_staff'.`);
  }

  // Validate location exists and type matches role requirement
  const location = await locationRepository.findLocationById(parseInt(locationId, 10));
  if (!location) {
    throw new NotFoundError('Selected operating location does not exist');
  }

  if (role === 'branch_staff' && location.type !== 'branch') {
    throw new BadRequestError(`Branch staff must be assigned to a location of type 'branch' (Selected: '${location.name}' [${location.type}])`);
  }

  if (role === 'warehouse_staff' && location.type !== 'warehouse') {
    throw new BadRequestError(`Warehouse staff must be assigned to a location of type 'warehouse' (Selected: '${location.name}' [${location.type}])`);
  }

  const existingUser = await userRepository.findUserByEmail(cleanEmail);
  if (existingUser) {
    throw new ConflictError('An account with this email address already exists');
  }

  const passwordHash = await hashPassword(password);

  const userId = await userRepository.createUser({
    name: cleanName,
    email: cleanEmail,
    passwordHash,
    role,
    locationId: location.id,
    isActive: true,
    isEmailVerified: true, // Staff accounts created by admin are auto-verified
  });

  return await userRepository.findUserById(userId);
};

export const getAllUsers = async (options) => {
  return await userRepository.listUsers(options);
};

export const getUserById = async (id) => {
  const user = await userRepository.findUserById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
};

export const setUserActiveStatus = async ({ actorId, targetId, isActive, password }) => {
  if (!password) throw new BadRequestError('Administrator password is required to change account access');
  if (actorId === targetId && !isActive) throw new BadRequestError('You cannot deactivate your own administrator account');
  const actorProfile = await userRepository.findUserById(actorId);
  const actor = actorProfile ? await userRepository.findUserByEmail(actorProfile.email) : null;
  if (!actor || !(await comparePassword(password, actor.password_hash))) throw new UnauthorizedError('Administrator password is incorrect');
  const user = await userRepository.findUserById(targetId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  await userRepository.updateUserActiveStatus(targetId, isActive);
  return await userRepository.findUserById(targetId);
};

export const deleteUserAccount = async ({ actorId, targetId, password }) => {
  if (!password) throw new BadRequestError('Administrator password is required to delete an account');
  if (actorId === targetId) throw new BadRequestError('You cannot delete your own administrator account');
  
  const actorProfile = await userRepository.findUserById(actorId);
  const actor = actorProfile ? await userRepository.findUserByEmail(actorProfile.email) : null;
  if (!actor || !(await comparePassword(password, actor.password_hash))) throw new UnauthorizedError('Administrator password is incorrect');
  
  const user = await userRepository.findUserById(targetId);
  if (!user) throw new NotFoundError('User not found');

  const hasActivity = await userRepository.hasUserActivity(targetId);
  if (hasActivity) {
    throw new BadRequestError(`Cannot delete user '${user.name}': Account has associated transactions, logs, or movement records. Keep account deactivated to preserve audit trails.`);
  }

  await userRepository.deleteUserById(targetId);
  return { success: true, message: `Account for ${user.name} has been permanently deleted.` };
};

export default {
  createStaffAccount,
  getAllUsers,
  getUserById,
  setUserActiveStatus,
  deleteUserAccount,
};
