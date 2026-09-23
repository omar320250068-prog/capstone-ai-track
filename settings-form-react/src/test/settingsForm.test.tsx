import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsForm } from '../components/SettingsForm'

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/display name/i), 'Ann')
  await user.type(screen.getByLabelText(/^email/i), 'ann@example.com')
  await user.type(screen.getByLabelText(/^password/i), 'secret123')
  await user.type(screen.getByLabelText(/confirm password/i), 'secret123')
}

describe('SettingsForm', () => {
  it('shows inline errors on an invalid submit and marks fields invalid', async () => {
    const user = userEvent.setup()
    render(<SettingsForm />)
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText(/display name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    const email = screen.getByLabelText(/^email/i)
    expect(email).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a success message on a valid submit', async () => {
    const user = userEvent.setup()
    render(<SettingsForm />)
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText(/saved\./i)).toBeInTheDocument()
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
  })

  it('clears a field error as soon as the field becomes valid (no re-submit needed)', async () => {
    const user = userEvent.setup()
    render(<SettingsForm />)
    await user.type(screen.getByLabelText(/^email/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/^email/i))
    await user.type(screen.getByLabelText(/^email/i), 'ann@example.com')
    expect(screen.queryByText(/enter a valid email/i)).not.toBeInTheDocument()
  })

  it('only announces an error live for fields that actually have one', async () => {
    const user = userEvent.setup()
    render(<SettingsForm />)
    await user.click(screen.getByRole('button', { name: /save/i }))

    const alerts = screen.getAllByRole('alert')
    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts.length).toBeLessThan(6)
    expect(alerts.some((el) => el.textContent?.includes('Display name is required.'))).toBe(true)
  })
})