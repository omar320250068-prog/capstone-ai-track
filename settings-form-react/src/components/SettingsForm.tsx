import { type FormEvent, type ChangeEvent, useState } from 'react'
import { validateSettings } from '../lib/validate'

const initialForm = {
  displayName: '',
  email: '',
  password: '',
  passwordConfirm: '',
  theme: 'system',
  maxResults: '20',
}

type FormField = keyof typeof initialForm

export function SettingsForm() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const handleChange =
    (field: FormField) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm({ ...form, [field]: e.target.value })
    }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const { errors, values } = validateSettings(form)
    setErrors(errors)
    const ok = Object.keys(errors).length === 0
    setSaved(ok)
    if (ok) {
      console.log('Saved values', values)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="settings-card">
      <h1>Settings</h1>

      <div className="field">
        <label htmlFor="displayName">Display name</label>
        <input id="displayName" value={form.displayName} onChange={handleChange('displayName')} />
        <p className="error" id="err-displayName" role="alert" aria-live="polite">
          {errors.displayName ?? '\u00A0'}
        </p>
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={form.email} onChange={handleChange('email')} />
        <p className="error" id="err-email" role="alert" aria-live="polite">
          {errors.email ?? '\u00A0'}
        </p>
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={form.password} onChange={handleChange('password')} />
        <p className="error" id="err-password" role="alert" aria-live="polite">
          {errors.password ?? '\u00A0'}
        </p>
      </div>

      <div className="field">
        <label htmlFor="passwordConfirm">Confirm password</label>
        <input id="passwordConfirm" type="password" value={form.passwordConfirm} onChange={handleChange('passwordConfirm')} />
        <p className="error" id="err-passwordConfirm" role="alert" aria-live="polite">
          {errors.passwordConfirm ?? '\u00A0'}
        </p>
      </div>

      <div className="field">
        <label htmlFor="theme">Theme</label>
        <select id="theme" value={form.theme} onChange={handleChange('theme')}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
        <p className="error" id="err-theme" role="alert" aria-live="polite">
          {errors.theme ?? '\u00A0'}
        </p>
      </div>

      <div className="field">
        <label htmlFor="maxResults">Max results</label>
        <input
          id="maxResults"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          value={form.maxResults}
          onChange={handleChange('maxResults')}
        />
        <p className="error" id="err-maxResults" role="alert" aria-live="polite">
          {errors.maxResults ?? '\u00A0'}
        </p>
      </div>

      <button type="submit">Save settings</button>
      {saved ? <p className="ok">Saved.</p> : null}
    </form>
  )
}