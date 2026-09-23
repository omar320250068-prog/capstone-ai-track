'use strict';

const validate = window.validateSettings;

const FIELDS = ['displayName', 'email', 'password', 'passwordConfirm', 'theme', 'maxResults'];

function readForm() {
  return {
    displayName: document.getElementById('displayName').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    passwordConfirm: document.getElementById('passwordConfirm').value,
    theme: document.getElementById('theme').value,
    maxResults: document.getElementById('maxResults').value,
  };
}

function renderErrors(errors) {
  for (const field of FIELDS) {
    const input = document.getElementById(field);
    const errorEl = document.querySelector(`[data-error-for="${field}"]`);
    const message = errors[field];
    errorEl.textContent = message || '';
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', errorEl.id || (errorEl.id = `err-${field}`));
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }
}

const form = document.getElementById('settings');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const { values, errors } = validate(readForm());
  renderErrors(errors);
  document.getElementById('saved').hidden = Object.keys(errors).length > 0;
  if (Object.keys(errors).length === 0) {
    console.log('Saved values', values);
  }
});