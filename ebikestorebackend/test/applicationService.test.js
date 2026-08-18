import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLICATION_TRANSITIONS,
  canAccessApplication,
  generateApplicationReference,
  isApplicationTransitionAllowed,
} from '../src/features/applications/applicationService.js';

test('application lifecycle permits only defined Phase 6 transitions', () => {
  assert.deepEqual(APPLICATION_TRANSITIONS.submitted, ['under_review', 'rejected', 'cancelled']);
  assert.deepEqual(APPLICATION_TRANSITIONS.under_review, ['approved', 'rejected', 'cancelled']);
  assert.deepEqual(APPLICATION_TRANSITIONS.approved, ['completed']);
  assert.equal(isApplicationTransitionAllowed('submitted', 'completed'), false);
  assert.equal(isApplicationTransitionAllowed('rejected', 'completed'), false);
  assert.equal(isApplicationTransitionAllowed('completed', 'cancelled'), false);
});

test('completed applications cannot complete twice', () => {
  assert.equal(isApplicationTransitionAllowed('approved', 'completed'), true);
  assert.equal(isApplicationTransitionAllowed('completed', 'completed'), false);
});

test('customer ownership and staff location access are scoped', () => {
  const application = { customer_user_id: 7, location_id: 3 };
  assert.equal(canAccessApplication({ id: 7, role: 'customer' }, application), true);
  assert.equal(canAccessApplication({ id: 8, role: 'customer' }, application), false);
  assert.equal(canAccessApplication({ id: 9, role: 'branch_staff', location_id: 3 }, application), true);
  assert.equal(canAccessApplication({ id: 10, role: 'branch_staff', location_id: 4 }, application), false);
  assert.equal(canAccessApplication({ id: 1, role: 'admin' }, application), true);
});

test('application references use a year and random non-sequential suffix', () => {
  assert.match(generateApplicationReference(new Date('2026-08-12T00:00:00Z')), /^APP-2026-[A-F0-9]{6}$/);
});
