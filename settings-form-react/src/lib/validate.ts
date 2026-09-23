export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const THEMES = ['light', 'dark', 'system'] as const

export type SettingsInput = {
  displayName: string
  email: string
  password: string
  passwordConfirm: string
  theme: string
  maxResults: string
}

export type SettingsErrors = Partial<
  Record<'displayName' | 'email' | 'password' | 'passwordConfirm' | 'theme' | 'maxResults', string>
>

export function validateSettings(input: SettingsInput) {
  const errors: SettingsErrors = {}

  const name = input.displayName.trim()
  if (!name) errors.displayName = 'Display name is required.'
  else if (name.length < 2 || name.length > 40) errors.displayName = 'Display name must be 2-40 characters.'

  const email = input.email.trim()
  if (!email) errors.email = 'Email is required.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'

  const password = input.password
  if (!password) errors.password = 'Password is required.'
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.'

  if (input.passwordConfirm !== password) errors.passwordConfirm = 'Passwords do not match.'

  if (!THEMES.includes(input.theme as (typeof THEMES)[number])) errors.theme = 'Theme must be light, dark, or system.'

  const maxResults = parseInt(input.maxResults, 10)
  if (Number.isNaN(maxResults) || maxResults < 1 || maxResults > 100) {
    errors.maxResults = 'Max results must be an integer between 1 and 100.'
  }

  return {
    errors,
    values: { displayName: name, email, password, passwordConfirm: input.passwordConfirm, theme: input.theme, maxResults },
  }
}