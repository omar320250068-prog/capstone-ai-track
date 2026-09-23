import { type ChangeEvent, type FormEvent, useId, useState } from 'react'
import { validateSettings, type SettingsErrors, THEMES } from '../lib/validate'

const initialForm = {
  displayName: '',
  email: '',
  password: '',
  passwordConfirm: '',
  theme: 'system',
  maxResults: '20',
}

type FormField = keyof typeof initialForm

function Field({
  label,
  name,
  type,
  value,
  onChange,
  errorId,
  error,
  autocomplete,
}: {
  label: string
  name: FormField
  type?: 'email' | 'password' | 'number'
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  errorId: string
  error: string | undefined
  autocomplete?: string
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        inputMode={type === 'number' ? 'numeric' : undefined}
        min={type === 'number' ? 1 : undefined}
        max={type === 'number' ? 100 : undefined}
        value={value}
        onChange={onChange}
        autoComplete={autocomplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      <p className="error" id={errorId} role={error ? 'alert' : undefined}>
        {error ?? '\u00A0'}
      </p>
    </div>
  )
}

export function SettingsForm() {
  const uid = useId()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<SettingsErrors>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [saved, setSaved] = useState(false)

  const errorIdFor = (field: FormField) => `${uid}-${field}-error`

  const handleChange = (field: FormField) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const next = { ...form, [field]: e.target.value }
    setForm(next)
    setSaved(false)
    if (hasSubmitted) setErrors(validateSettings(next).errors)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setHasSubmitted(true)
    const { errors, values } = validateSettings(form)
    setErrors(errors)
    setSaved(Object.keys(errors).length === 0)
    if (Object.keys(errors).length === 0) {
      console.info('Validated settings values', values)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="settings-card">
      <h1>Settings</h1>

      <Field
        label="Display name"
        name="displayName"
        value={form.displayName}
        onChange={handleChange('displayName')}
        errorId={errorIdFor('displayName')}
        error={errors.displayName}
        autocomplete="name"
      />
      <Field
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange('email')}
        errorId={errorIdFor('email')}
        error={errors.email}
        autocomplete="email"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange('password')}
        errorId={errorIdFor('password')}
        error={errors.password}
        autocomplete="new-password"
      />
      <Field
        label="Confirm password"
        name="passwordConfirm"
        type="password"
        value={form.passwordConfirm}
        onChange={handleChange('passwordConfirm')}
        errorId={errorIdFor('passwordConfirm')}
        error={errors.passwordConfirm}
        autocomplete="new-password"
      />

      <div className="field">
        <label htmlFor="theme">Theme</label>
        <select
          id="theme"
          value={form.theme}
          onChange={handleChange('theme')}
          aria-invalid={errors.theme ? true : undefined}
          aria-describedby={errors.theme ? errorIdFor('theme') : undefined}
        >
          {THEMES.map((theme) => (
            <option key={theme} value={theme}>
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </option>
          ))}
        </select>
        <p className="error" id={errorIdFor('theme')} role={errors.theme ? 'alert' : undefined}>
          {errors.theme ?? '\u00A0'}
        </p>
      </div>

      <Field
        label="Max results"
        name="maxResults"
        type="number"
        value={form.maxResults}
        onChange={handleChange('maxResults')}
        errorId={errorIdFor('maxResults')}
        error={errors.maxResults}
      />

      <button type="submit">Save settings</button>
      {saved ? <p className="ok">Saved.</p> : null}
    </form>
  )
}