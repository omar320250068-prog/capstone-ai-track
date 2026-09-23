'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { validateSettings } = require('../src/validate.js');

const VALID = {
  displayName: 'Ann',
  email: 'ann@example.com',
  password: 'secret123',
  passwordConfirm: 'secret123',
  theme: 'system',
  maxResults: 20,
};

test('valid input returns no errors and trimmed values', () => {
  const { values, errors } = validateSettings({
    displayName: '  Ann  ',
    email: ' ann@example.com ',
    password: 'secret123',
    passwordConfirm: 'secret123',
    theme: 'dark',
    maxResults: 25,
  });
  assert.deepEqual(errors, {});
  assert.equal(values.displayName, 'Ann');
  assert.equal(values.email, 'ann@example.com');
  assert.equal(values.theme, 'dark');
  assert.equal(values.maxResults, 25);
});

test('empty displayName is rejected', () => {
  const { values, errors } = validateSettings({ ...VALID, displayName: '   ' });
  assert.ok(errors.displayName);
  assert.equal(values.displayName, undefined);
});

test('1-character displayName is rejected', () => {
  const { errors } = validateSettings({ ...VALID, displayName: 'A' });
  assert.ok(errors.displayName);
});

test('displayName longer than 40 characters is rejected', () => {
  const { errors } = validateSettings({ ...VALID, displayName: 'x'.repeat(41) });
  assert.ok(errors.displayName);
});

test('email missing @ is rejected', () => {
  const { errors } = validateSettings({ ...VALID, email: 'annexample.com' });
  assert.ok(errors.email);
});

test('email missing "." after domain is rejected', () => {
  const { errors } = validateSettings({ ...VALID, email: 'ann@example' });
  assert.ok(errors.email);
});

test('empty email is rejected', () => {
  const { errors } = validateSettings({ ...VALID, email: '' });
  assert.ok(errors.email);
});

test('7-character password is rejected', () => {
  const { errors } = validateSettings({ ...VALID, password: '7charss', passwordConfirm: '7charss' });
  assert.ok(errors.password);
});

test('mismatched password confirm is rejected', () => {
  const { errors } = validateSettings({ ...VALID, passwordConfirm: 'secret124' });
  assert.ok(errors.passwordConfirm);
});

test('invalid theme is rejected', () => {
  const { values, errors } = validateSettings({ ...VALID, theme: 'neon' });
  assert.ok(errors.theme);
  assert.equal(values.theme, undefined);
});

test('maxResults of 0 is rejected', () => {
  const { errors } = validateSettings({ ...VALID, maxResults: 0 });
  assert.ok(errors.maxResults);
});

test('maxResults of 101 is rejected', () => {
  const { errors } = validateSettings({ ...VALID, maxResults: 101 });
  assert.ok(errors.maxResults);
});

test('non-integer maxResults is rejected', () => {
  const { errors } = validateSettings({ ...VALID, maxResults: 20.5 });
  assert.ok(errors.maxResults);
  const { errors: stringErrors } = validateSettings({ ...VALID, maxResults: 'twenty' });
  assert.ok(stringErrors.maxResults);
});

test('empty input reports missing required fields', () => {
  const { values, errors } = validateSettings({});
  assert.deepEqual(values, { theme: 'system' });
  assert.ok(errors.displayName);
  assert.ok(errors.email);
  assert.ok(errors.password);
  assert.ok(errors.passwordConfirm);
  assert.ok(errors.maxResults);
});