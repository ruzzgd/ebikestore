import test from 'node:test';
import assert from 'node:assert/strict';
import { assertEmailDeliverySucceeded } from '../src/features/auth/authService.js';

test('email verification flow continues after confirmed delivery', () => {
  assert.doesNotThrow(() => {
    assertEmailDeliverySucceeded({ success: true, id: 'email-id' }, 'Unable to send code');
  });
});

test('email verification flow stops when delivery fails', () => {
  assert.throws(
    () => assertEmailDeliverySucceeded({ success: false, error: 'Provider rejected request' }, 'Unable to send code'),
    (error) => error.statusCode === 503 && error.message === 'Unable to send code'
  );
});

test('email verification flow stops when provider returns no result', () => {
  assert.throws(
    () => assertEmailDeliverySucceeded(undefined, 'Unable to resend code'),
    (error) => error.statusCode === 503 && error.message === 'Unable to resend code'
  );
});
