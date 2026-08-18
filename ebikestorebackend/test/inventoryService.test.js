import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveAvailability } from '../src/features/inventory/inventoryService.js';

test('availability is out of stock when quantity is zero', () => {
  assert.equal(deriveAvailability(0, 5), 'out_of_stock');
});

test('availability is limited at and below the configured threshold', () => {
  assert.equal(deriveAvailability(3, 5), 'limited_stock');
  assert.equal(deriveAvailability(5, 5), 'limited_stock');
});

test('availability is available above the configured threshold', () => {
  assert.equal(deriveAvailability(6, 5), 'available');
});
