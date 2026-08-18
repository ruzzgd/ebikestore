import crypto from 'crypto';
import { getPool } from '../../db/connection.js';
import applicationRepository from './applicationRepository.js';
import inventoryRepository from '../inventory/inventoryRepository.js';
import { stockOutInTransaction } from '../inventory/inventoryService.js';
import userRepository from '../users/userRepository.js';
import productRepository from '../products/productRepository.js';
import locationRepository from '../locations/locationRepository.js';
import { createForUsers, getAdminIds, getLocationStaffIds, getRecipientsForLocation } from '../notifications/notificationService.js';
import { sendEmail } from '../../providers/resendProvider.js';
import { verifyCurrentPassword } from '../auth/authService.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';

export const APPLICATION_STATUSES = Object.freeze(['submitted', 'under_review', 'approved', 'rejected', 'completed', 'cancelled']);
export const APPLICATION_TRANSITIONS = Object.freeze({
  submitted: Object.freeze(['under_review', 'rejected', 'cancelled']),
  under_review: Object.freeze(['approved', 'rejected', 'cancelled']),
  approved: Object.freeze(['completed']),
  rejected: Object.freeze([]),
  completed: Object.freeze([]),
  cancelled: Object.freeze([]),
});

export const isApplicationTransitionAllowed = (currentStatus, nextStatus) => Boolean(APPLICATION_TRANSITIONS[currentStatus]?.includes(nextStatus));
export const generateApplicationReference = (date = new Date()) => `APP-${date.getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

export const canAccessApplication = (actor, application) => {
  if (actor.role === 'admin') return true;
  if (actor.role === 'customer') return Number(application.customer_user_id) === Number(actor.id);
  return Number(application.location_id) === Number(actor.location_id);
};

const parsePositiveInteger = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new BadRequestError(`${fieldName} must be a positive integer`);
  return parsed;
};

const requiredText = (value, fieldName, maxLength) => {
  const clean = value === undefined || value === null ? '' : String(value).trim();
  if (!clean) throw new BadRequestError(`${fieldName} is required`);
  if (clean.length > maxLength) throw new BadRequestError(`${fieldName} cannot exceed ${maxLength} characters`);
  return clean;
};

const optionalText = (value, fieldName, maxLength) => {
  const clean = value === undefined || value === null ? '' : String(value).trim();
  if (clean.length > maxLength) throw new BadRequestError(`${fieldName} cannot exceed ${maxLength} characters`);
  return clean || null;
};

const getActor = async (authUser) => {
  const actor = await userRepository.findUserById(authUser.userId);
  if (!actor || !actor.is_active) throw new UnauthorizedError('Active user account required');
  return actor;
};

const assertAccess = (actor, application) => {
  if (!canAccessApplication(actor, application)) throw new ForbiddenError('This application is outside your permitted scope');
};

const assertStaffAction = (actor, application) => {
  if (!['admin', 'branch_staff', 'warehouse_staff'].includes(actor.role)) throw new ForbiddenError('Staff or administrator access required');
  assertAccess(actor, application);
};

const assertTransition = (application, nextStatus) => {
  if (!application) throw new NotFoundError('Customer application not found');
  if (!isApplicationTransitionAllowed(application.status, nextStatus)) {
    throw new ConflictError(`Application cannot transition from '${application.status}' to '${nextStatus}'`);
  }
};

const toCustomerView = (application) => {
  if (!application) return application;
  const {
    reviewed_by_user_id: _reviewedById,
    reviewed_by_name: _reviewedByName,
    completed_by_user_id: _completedById,
    completed_by_name: _completedByName,
    customer_email: _customerEmail,
    ...safeApplication
  } = application;
  return safeApplication;
};

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

const sendApplicationStatusEmail = async (application, statusLabel) => {
  try {
    await sendEmail({
      to: application.customer_email,
      subject: `${application.application_reference} — ${statusLabel}`,
      html: `<p>Hello ${escapeHtml(application.account_name)},</p><p>Your application <strong>${escapeHtml(application.application_reference)}</strong> for ${escapeHtml(application.product_name)} at ${escapeHtml(application.location_name)} is now <strong>${escapeHtml(statusLabel)}</strong>.</p>`,
      text: `Hello ${application.account_name}, your application ${application.application_reference} for ${application.product_name} at ${application.location_name} is now ${statusLabel}.`,
    });
  } catch (error) {
    console.warn(`[APPLICATION EMAIL WARNING] ${application.application_reference}: ${error.message}`);
  }
};

export const createApplication = async (authUser, data) => {
  const actor = await getActor(authUser);
  if (actor.role !== 'customer') throw new ForbiddenError('Only customer accounts may submit applications');
  const productId = parsePositiveInteger(data.productId ?? data.product_id, 'productId');
  const locationId = parsePositiveInteger(data.locationId ?? data.location_id, 'locationId');
  const quantity = parsePositiveInteger(data.quantity, 'quantity');
  const customerName = requiredText(data.customerName ?? data.customer_name ?? actor.name, 'customerName', 255);
  const contactNumber = requiredText(data.contactNumber ?? data.contact_number, 'contactNumber', 50);
  if (contactNumber.length < 7) throw new BadRequestError('contactNumber must contain at least 7 characters');
  const address = requiredText(data.address, 'address', 500);
  const purpose = requiredText(data.purpose, 'purpose', 500);
  const notes = optionalText(data.notes, 'notes', 1000);

  const birthDate = new Date(data.birth_date ?? data.birthDate);
  if (isNaN(birthDate.getTime())) throw new BadRequestError('Valid birth_date is required');
  const today = new Date('2026-08-13T08:08:15+08:00');
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

  const idType = requiredText(data.id_type ?? data.idType, 'id_type', 50);
  const idNumber = requiredText(data.id_number ?? data.idNumber, 'id_number', 100);
  const idExpirationDate = new Date(data.id_expiration_date ?? data.idExpirationDate);
  if (isNaN(idExpirationDate.getTime())) throw new BadRequestError('Valid id_expiration_date is required');

  let renewalReceiptPresent = Boolean(data.renewal_receipt_present ?? data.renewalReceiptPresent);
  if (idExpirationDate < today && !renewalReceiptPresent) {
    throw new BadRequestError('If ID is expired, renewal_receipt_present must be true');
  }

  const usesBarangayClearance = Boolean(data.uses_barangay_clearance ?? data.usesBarangayClearance);
  const barangayClearanceReference = usesBarangayClearance ? requiredText(data.barangay_clearance_reference ?? data.barangayClearanceReference, 'barangay_clearance_reference', 100) : null;

  let guardianName = null;
  let guardianIdType = null;
  let guardianIdNumber = null;
  if (age < 18) {
    guardianName = requiredText(data.guardian_name ?? data.guardianName, 'guardian_name', 255);
    guardianIdType = requiredText(data.guardian_id_type ?? data.guardianIdType, 'guardian_id_type', 50);
    guardianIdNumber = requiredText(data.guardian_id_number ?? data.guardianIdNumber, 'guardian_id_number', 100);
  }
  const [product, location, inventory] = await Promise.all([
    productRepository.findProductById(productId),
    locationRepository.findLocationById(locationId),
    inventoryRepository.findByProductAndLocation(productId, locationId),
  ]);
  if (!product) throw new NotFoundError('Product not found');
  if (!product.is_active) throw new BadRequestError('Applications require an active product');
  if (!location) throw new NotFoundError('Location not found');
  if (!location.is_active || location.type !== 'branch') throw new BadRequestError('Applications require an active customer-facing branch');
  if (!inventory || Number(inventory.quantity) < quantity) throw new ConflictError('Requested quantity is not currently available at this branch');
  const connection = await getPool().getConnection();
  let applicationId;
  const applicationReference = generateApplicationReference();
  try {
    await connection.beginTransaction();
    applicationId = await applicationRepository.createApplication(connection, {
      applicationReference, customerUserId: actor.id, productId, locationId,
      quantity, customerName, contactNumber, address, purpose, notes,
      birthDate, idType, idNumber, idExpirationDate, usesBarangayClearance,
      barangayClearanceReference, renewalReceiptPresent, guardianName, guardianIdType, guardianIdNumber
    });
    const recipients = await getRecipientsForLocation(connection, locationId, { includeAdmins: true });
    await createForUsers(connection, recipients, {
      type: 'application_submitted', title: 'New customer application',
      message: `${applicationReference} was submitted for ${product.name} at ${location.name}.`,
      referenceType: 'customer_application', referenceId: String(applicationId),
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
  return toCustomerView(await applicationRepository.findById(applicationId));
};

export const listMyApplications = async (authUser, filters = {}) => {
  const actor = await getActor(authUser);
  if (actor.role !== 'customer') throw new ForbiddenError('Customer account required');
  if (filters.status && !APPLICATION_STATUSES.includes(filters.status)) throw new BadRequestError('Invalid application status');
  const applications = await applicationRepository.listApplications({ customerUserId: actor.id, status: filters.status || null, limit: filters.limit, offset: filters.offset });
  return applications.map(toCustomerView);
};

export const listManagedApplications = async (authUser, filters = {}) => {
  const actor = await getActor(authUser);
  if (!['admin', 'branch_staff', 'warehouse_staff'].includes(actor.role)) throw new ForbiddenError('Staff or administrator access required');
  if (filters.status && !APPLICATION_STATUSES.includes(filters.status)) throw new BadRequestError('Invalid application status');
  const requestedLocationId = filters.locationId ? parsePositiveInteger(filters.locationId, 'locationId') : null;
  if (actor.role !== 'admin' && requestedLocationId && requestedLocationId !== actor.location_id) throw new ForbiddenError('Staff may only list their assigned location');
  return applicationRepository.listApplications({
    locationId: actor.role === 'admin' ? requestedLocationId : actor.location_id,
    status: filters.status || null, dateFrom: filters.dateFrom || null, dateTo: filters.dateTo || null,
    limit: filters.limit, offset: filters.offset,
  });
};

export const getApplication = async (authUser, idValue) => {
  const actor = await getActor(authUser);
  const application = await applicationRepository.findById(parsePositiveInteger(idValue, 'applicationId'));
  if (!application) throw new NotFoundError('Customer application not found');
  assertAccess(actor, application);
  return actor.role === 'customer' ? toCustomerView(application) : application;
};

const runLockedTransition = async (idValue, handler) => {
  const id = parsePositiveInteger(idValue, 'applicationId');
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    await handler(connection, id);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
  return applicationRepository.findById(id);
};

export const startReview = async (authUser, idValue) => {
  const actor = await getActor(authUser);
  return runLockedTransition(idValue, async (connection, id) => {
    const application = await applicationRepository.lockApplication(connection, id);
    if (!application) throw new NotFoundError('Customer application not found');
    assertStaffAction(actor, application);
    assertTransition(application, 'under_review');
    await applicationRepository.setStatus(connection, id, 'under_review', { actorId: actor.id });
    await createForUsers(connection, [application.customer_user_id], {
      type: 'application_under_review', title: 'Application under review',
      message: `Your application reference ${application.application_reference} is now under review.`,
      referenceType: 'customer_application', referenceId: String(application.id),
    });
  });
};

export const approveApplication = async (authUser, idValue) => {
  const actor = await getActor(authUser);
  const result = await runLockedTransition(idValue, async (connection, id) => {
    const application = await applicationRepository.lockApplication(connection, id);
    if (!application) throw new NotFoundError('Customer application not found');
    assertStaffAction(actor, application);
    assertTransition(application, 'approved');
    const product = await applicationRepository.lockProduct(connection, application.product_id);
    const location = await applicationRepository.lockLocation(connection, application.location_id);
    if (!product?.is_active || !location?.is_active || location.type !== 'branch') throw new ConflictError('Product and branch must remain active');
    const inventory = await inventoryRepository.lockByProductAndLocation(connection, application.product_id, application.location_id);
    if (!inventory || Number(inventory.quantity) < application.quantity) throw new ConflictError('Insufficient stock to approve this application');
    await applicationRepository.setStatus(connection, id, 'approved', { actorId: actor.id });
    await createForUsers(connection, [application.customer_user_id], {
      type: 'application_approved', title: 'Application approved',
      message: `Your application reference ${application.application_reference} has been approved. Contact the branch for the offline transaction process.`,
      referenceType: 'customer_application', referenceId: String(application.id),
    });
  });
  await sendApplicationStatusEmail(result, 'Approved');
  return result;
};

export const rejectApplication = async (authUser, idValue, reasonValue) => {
  const actor = await getActor(authUser);
  const rejectionReason = requiredText(reasonValue, 'rejectionReason', 500);
  const result = await runLockedTransition(idValue, async (connection, id) => {
    const application = await applicationRepository.lockApplication(connection, id);
    if (!application) throw new NotFoundError('Customer application not found');
    assertStaffAction(actor, application);
    assertTransition(application, 'rejected');
    await applicationRepository.setStatus(connection, id, 'rejected', { actorId: actor.id, rejectionReason });
    await createForUsers(connection, [application.customer_user_id], {
      type: 'application_rejected', title: 'Application rejected',
      message: `Your application reference ${application.application_reference} has been rejected.`,
      referenceType: 'customer_application', referenceId: String(application.id),
    });
  });
  await sendApplicationStatusEmail(result, 'Rejected');
  return result;
};

export const cancelApplication = async (authUser, idValue) => {
  const actor = await getActor(authUser);
  if (actor.role !== 'customer') throw new ForbiddenError('Only the customer may cancel an application');
  const application = await runLockedTransition(idValue, async (connection, id) => {
    const application = await applicationRepository.lockApplication(connection, id);
    if (!application) throw new NotFoundError('Customer application not found');
    assertAccess(actor, application);
    assertTransition(application, 'cancelled');
    await applicationRepository.setStatus(connection, id, 'cancelled');
    const recipients = [...(await getLocationStaffIds(connection, application.location_id)), ...(await getAdminIds(connection))];
    await createForUsers(connection, recipients, {
      type: 'application_cancelled', title: 'Customer application cancelled',
      message: `${application.application_reference} was cancelled by the customer.`,
      referenceType: 'customer_application', referenceId: String(application.id),
    });
  });
  return toCustomerView(application);
};

export const completeApplication = async (authUser, idValue, passwordValue) => {
  const actor = await getActor(authUser);
  await verifyCurrentPassword(actor.id, passwordValue);
  const result = await runLockedTransition(idValue, async (connection, id) => {
    const application = await applicationRepository.lockApplication(connection, id);
    if (!application) throw new NotFoundError('Customer application not found');
    assertStaffAction(actor, application);
    assertTransition(application, 'completed');
    const product = await applicationRepository.lockProduct(connection, application.product_id);
    const location = await applicationRepository.lockLocation(connection, application.location_id);
    if (!product?.is_active || !location?.is_active || location.type !== 'branch') throw new ConflictError('Product and branch must remain active');
    await stockOutInTransaction(connection, {
      productId: application.product_id, locationId: application.location_id, type: 'stock_out',
      quantity: application.quantity,
      referenceType: 'customer_application', referenceId: String(application.id),
      note: `Released via ${application.application_reference}`, performedByUserId: actor.id,
    });
    await applicationRepository.setStatus(connection, id, 'completed', { actorId: actor.id });
    await createForUsers(connection, [application.customer_user_id], {
      type: 'application_completed', title: 'Application completed',
      message: `Your application reference ${application.application_reference} has been completed and the product was released.`,
      referenceType: 'customer_application', referenceId: String(application.id),
    });
  });
  await sendApplicationStatusEmail(result, 'Completed');
  return result;
};

export default { createApplication, listMyApplications, listManagedApplications, getApplication, startReview, approveApplication, rejectApplication, cancelApplication, completeApplication };
