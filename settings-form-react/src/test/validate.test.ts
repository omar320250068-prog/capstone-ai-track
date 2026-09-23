import { describe, expect, it } from 'vitest'
import { validateSettings } from '../lib/validate'

const valid = {
  displayName: 'Ann',
  email: 'ann@example.com',
  password: 'secret123',
  passwordConfirm: 'secret123',
  theme: 'system',
  maxResults: '20',
}

describe('validateSettings', () => {
  it('accepts a fully valid form and returns trimmed values', () => {
    const { errors, values } = validateSettings({
      ...valid,
      displayName: '  Ann  ',
      email: ' ann@example.com ',
      theme: 'dark',
      maxResults: '25',
    })
    expect(errors).toEqual({})
    expect(values).toMatchObject({ displayName: 'Ann', email: 'ann@example.com', theme: 'dark', maxResults: 25 })
  })

  it('rejects an empty display name', () => {
    const { errors } = validateSettings({ ...valid, displayName: '  ' })
    expect(errors.displayName).toBeTruthy()
  })

  it('rejects a 1-character display name', () => {
    const { errors } = validateSettings({ ...valid, displayName: 'A' })
    expect(errors.displayName).toBeTruthy()
  })

  it('rejects an email missing the @ symbol', () => {
    const { errors } = validateSettings({ ...valid, email: 'annexample.com' })
    expect(errors.email).toBeTruthy()
  })

  it('rejects an email missing the domain dot', () => {
    const { errors } = validateSettings({ ...valid, email: 'ann@example' })
    expect(errors.email).toBeTruthy()
  })

  it('rejects a 7-character password', () => {
    const { errors } = validateSettings({ ...valid, password: '7charss', passwordConfirm: '7charss' })
    expect(errors.password).toBeTruthy()
  })

  it('rejects a mismatched password confirmation', () => {
    const { errors } = validateSettings({ ...valid, passwordConfirm: 'secret124' })
    expect(errors.passwordConfirm).toBeTruthy()
  })

  it('rejects an unknown theme', () => {
    const { errors } = validateSettings({ ...valid, theme: 'neon' })
    expect(errors.theme).toBeTruthy()
  })

  it('rejects maxResults of 0', () => {
    const { errors } = validateSettings({ ...valid, maxResults: '0' })
    expect(errors.maxResults).toBeTruthy()
  })

  it('rejects maxResults of 101', () => {
    const { errors } = validateSettings({ ...valid, maxResults: '101' })
    expect(errors.maxResults).toBeTruthy()
  })

  it('rejects a non-integer maxResults like 20.5', () => {
    const { errors } = validateSettings({ ...valid, maxResults: '20.5' })
    expect(errors.maxResults).toBeTruthy()
  })

  it('rejects a non-numeric maxResults', () => {
    const { errors } = validateSettings({ ...valid, maxResults: 'twenty' })
    expect(errors.maxResults).toBeTruthy()
  })
})