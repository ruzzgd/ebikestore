import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_TRANSITIONS, canReviewRequest, generateRequestReference, isTransitionAllowed } from '../src/features/interBranchRequests/interBranchRequestService.js';

test('request workflow allows only the Phase 5 lifecycle transitions', () => {
  assert.deepEqual(ALLOWED_TRANSITIONS.pending, ['approved', 'rejected']);
  assert.deepEqual(ALLOWED_TRANSITIONS.approved, ['in_transit']);
  assert.deepEqual(ALLOWED_TRANSITIONS.in_transit, ['received']);
  assert.equal(isTransitionAllowed('pending', 'received'), false);
  assert.equal(isTransitionAllowed('rejected', 'approved'), false);
  assert.equal(isTransitionAllowed('received', 'in_transit'), false);
});

test('dispatch and receipt cannot repeat after their status has advanced', () => {
  assert.equal(isTransitionAllowed('approved', 'in_transit'), true);
  assert.equal(isTransitionAllowed('in_transit', 'in_transit'), false);
  assert.equal(isTransitionAllowed('in_transit', 'received'), true);
  assert.equal(isTransitionAllowed('received', 'received'), false);
});

test('request reference contains the year and a random non-sequential suffix', () => {
  const reference = generateRequestReference(new Date('2026-08-12T00:00:00Z'));
  assert.match(reference, /^REQ-2026-[A-F0-9]{6}$/);
});

test('request creators cannot review their own unit requests', () => {
  const request = { requested_by_user_id: 7, source_location_id: 2 };
  assert.equal(canReviewRequest({ id: 7, role: 'admin', location_id: null }, request), false);
  assert.equal(canReviewRequest({ id: 8, role: 'admin', location_id: null }, request), true);
  assert.equal(canReviewRequest({ id: 9, role: 'branch_staff', location_id: 2 }, request), true);
  assert.equal(canReviewRequest({ id: 10, role: 'branch_staff', location_id: 3 }, request), false);
});
