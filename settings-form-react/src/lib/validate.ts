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

export type ValidatedValues = {
  displayName: string
  email: string
  password: string
  passwordConfirm: string
  theme: (typeof THEMES)[number]
  maxResults: number
}

export function validateSettings(input: SettingsInput): { values: ValidatedValues; errors: SettingsErrors } {
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

  const theme = input.theme
  if (!THEMES.includes(theme as (typeof THEMES)[number])) errors.theme = 'Theme must be light, dark, or system.'

  const maxResultsNum = Number(input.maxResults)
  if (input.maxResults.trim() === '' || !Number.isInteger(maxResultsNum) || maxResultsNum < 1 || maxResultsNum > 100) {
    errors.maxResults = 'Max results must be an integer between 1 and 100.'
  }

  return {
    errors,
    values: {
      displayName: name,
      email,
      password,
      passwordConfirm: input.passwordConfirm,
      theme: theme as ValidatedValues['theme'],
      maxResults: maxResultsNum,
    },
  }
}