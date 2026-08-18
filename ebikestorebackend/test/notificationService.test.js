import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NOTIFICATION_TYPES,
  shouldActivateLowStockAlert,
  shouldClearLowStockAlert,
} from '../src/features/notifications/notificationService.js';

test('notification types are fixed and include every Phase 7 domain event', () => {
  assert.ok(NOTIFICATION_TYPES.includes('low_stock'));
  assert.ok(NOTIFICATION_TYPES.includes('transfer_received'));
  assert.ok(NOTIFICATION_TYPES.includes('application_completed'));
  assert.equal(new Set(NOTIFICATION_TYPES).size, NOTIFICATION_TYPES.length);
});

test('low-stock alert activates once and does not spam while active', () => {
  assert.equal(shouldActivateLowStockAlert({ alertActive: false, quantityAfter: 5, threshold: 5 }), true);
  assert.equal(shouldActivateLowStockAlert({ alertActive: true, quantityAfter: 4, threshold: 5 }), false);
});

test('stock recovery clears alert state and permits a later retrigger', () => {
  assert.equal(shouldClearLowStockAlert({ alertActive: true, quantityAfter: 8, threshold: 5 }), true);
  assert.equal(shouldActivateLowStockAlert({ alertActive: false, quantityAfter: 5, threshold: 5 }), true);
});
