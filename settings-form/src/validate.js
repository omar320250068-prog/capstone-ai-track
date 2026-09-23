'use strict';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const THEMES = new Set(['light', 'dark', 'system']);

function validateSettings(input = {}) {
  const errors = {};
  const values = {};

  const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
  if (!displayName) {
    errors.displayName = 'Display name is required.';
  } else if (displayName.length < 2 || displayName.length > 40) {
    errors.displayName = 'Display name must be 2-40 characters.';
  } else {
    values.displayName = displayName;
  }

  const email = typeof input.email === 'string' ? input.email.trim() : '';
  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.';
  } else {
    values.email = email;
  }

  const password = typeof input.password === 'string' ? input.password : '';
  const passwordConfirm = typeof input.passwordConfirm === 'string' ? input.passwordConfirm : '';

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  } else {
    values.password = password;
  }

  if (passwordConfirm !== password) {
    errors.passwordConfirm = 'Passwords do not match.';
  } else if (!passwordConfirm) {
    errors.passwordConfirm = 'Confirm your password.';
  } else {
    values.passwordConfirm = passwordConfirm;
  }

  const theme = typeof input.theme === 'string' ? input.theme : 'system';
  if (THEMES.has(theme)) {
    values.theme = theme;
  } else {
    errors.theme = 'Theme must be light, dark, or system.';
  }

  const maxResultsRaw = input.maxResults;
  const maxResultsNum = Number(maxResultsRaw);
  if (maxResultsRaw === undefined || maxResultsRaw === '') {
    errors.maxResults = 'Max results is required.';
  } else if (!Number.isInteger(maxResultsNum) || maxResultsNum < 1 || maxResultsNum > 100) {
    errors.maxResults = 'Max results must be an integer between 1 and 100.';
  } else {
    values.maxResults = maxResultsNum;
  }

  return { values, errors };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateSettings };
}
if (typeof window !== 'undefined') {
  window.validateSettings = validateSettings;
}