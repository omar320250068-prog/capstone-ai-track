import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Dialog } from '../dialog'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <button type="button">Next focus probe</button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Update your profile"
        description="A modal dialog test."
      >
        <label>
          Display name
          <input type="text" name="name" />
        </label>
        <button type="button" onClick={() => setOpen(false)}>
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </Dialog>
    </div>
  )
}

describe('Dialog (WAI-ARIA modal dialog pattern)', () => {
  it('renders with the correct roles and aria attributes', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
    expect(dialog).toHaveAttribute('aria-describedby')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Update your profile')
  })

  it('is closed by default', () => {
    render(<Harness />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('moves focus to the first focusable element on open', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const input = screen.getByRole('textbox', { name: 'Display name' })
    expect(document.activeElement).toBe(input)
  })

  it('marks the background content inert while open and clears it on close', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    expect((container as HTMLElement).inert).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect((container as HTMLElement).inert).toBe(false)
  })

  it('traps Tab: wrapping to the first element and backwards to the last', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const dialog = screen.getByRole('dialog')
    const first = screen.getByRole('textbox', { name: 'Display name' })
    const last = screen.getByRole('button', { name: 'Cancel' })

    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    last.focus()
    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    first.focus()
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })

  it('Escape closes the dialog and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Open dialog' })
    trigger.focus()
    await user.click(trigger)

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(trigger)
  })
})