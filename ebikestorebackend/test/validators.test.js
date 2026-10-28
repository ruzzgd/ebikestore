import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFullName, validateEmail, validateContactNumber } from '../src/utils/validators.js';

test('validateFullName rejects invalid names and accepts valid names', () => {
  // BUG 035: Special characters
  assert.throws(() => validateFullName('@#$%^&*'), /only contain letters/);
  assert.throws(() => validateFullName('John@Doe'), /only contain letters/);
  assert.throws(() => validateFullName('Admin!'), /only contain letters/);

  // BUG 036: Pure numbers or numbers within names
  assert.throws(() => validateFullName('123456'), /cannot contain numbers/);
  assert.throws(() => validateFullName('John2'), /cannot contain numbers/);
  assert.throws(() => validateFullName(''), /required/);
  assert.throws(() => validateFullName('A'), /between 2 and 100/);

  // Valid names
  assert.equal(validateFullName('Juan Dela Cruz'), 'Juan Dela Cruz');
  assert.equal(validateFullName('Maria Santos-Reyes'), 'Maria Santos-Reyes');
  assert.equal(validateFullName("O'Connor"), "O'Connor");
  assert.equal(validateFullName('Dr. Jose Rizal'), 'Dr. Jose Rizal');
});

test('validateContactNumber rejects incomplete and invalid phone numbers', () => {
  // BUG 038: Incomplete numbers
  assert.throws(() => validateContactNumber('123', { required: true }), /valid 11-digit mobile number/);
  assert.throws(() => validateContactNumber('0912', { required: true }), /valid 11-digit mobile number/);
  assert.throws(() => validateContactNumber('0912345678', { required: true }), /valid 11-digit mobile number/); // 10 digits starting with 09
  assert.throws(() => validateContactNumber('abcd1234567', { required: true }), /valid 11-digit mobile number/);

  // Valid numbers
  assert.equal(validateContactNumber('09171234567', { required: true }), '09171234567');
  assert.equal(validateContactNumber('+639171234567', { required: true }), '+639171234567');
  assert.equal(validateContactNumber('9171234567', { required: true }), '9171234567');
});

test('validateEmail validates format correctly', () => {
  assert.throws(() => validateEmail('plainaddress'), /valid email address/);
  assert.throws(() => validateEmail('user@domain'), /valid email address/);
  assert.throws(() => validateEmail('user@.com'), /valid email address/);

  assert.equal(validateEmail('test@gmail.com'), 'test@gmail.com');
  assert.equal(validateEmail('admin@fidelo.ph'), 'admin@fidelo.ph');
});
