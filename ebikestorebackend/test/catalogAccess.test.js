import test from 'node:test';
import assert from 'node:assert/strict';
import { authorize } from '../src/middleware/authMiddleware.js';
import { normalizeProductListQuery } from '../src/features/products/productController.js';
import { assertCategoryCanBeDeactivated } from '../src/features/categories/categoryService.js';

const runAuthorization = (role) => {
  let receivedError;
  authorize('admin')({ user: { role } }, {}, (error) => { receivedError = error; });
  return receivedError;
};

test('product catalog category filter is normalized for repository use', () => {
  assert.deepEqual(normalizeProductListQuery({ category: '3', search: 'battery' }), {
    activeOnly: false,
    categoryId: 3,
    search: 'battery',
    limit: 50,
    offset: 0,
  });
});

test('admin can pass catalog write authorization', () => {
  assert.equal(runAuthorization('admin'), undefined);
});

test('non-admin roles cannot pass product or category write authorization', () => {
  for (const role of ['branch_staff', 'warehouse_staff', 'customer']) {
    const error = runAuthorization(role);
    assert.equal(error?.statusCode, 403);
  }
});

test('category with active products cannot be deactivated', () => {
  assert.throws(
    () => assertCategoryCanBeDeactivated({ name: 'Accessories' }, 2),
    (error) => error.statusCode === 409 && error.message.includes('2 active products')
  );
  assert.doesNotThrow(() => assertCategoryCanBeDeactivated({ name: 'Accessories' }, 0));
});
