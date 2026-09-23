import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Disclosure } from '../disclosure'

function renderDisclosure() {
  return render(
    <Disclosure summary="Why a native button?">
      <p>Because Enter and Space activation come for free.</p>
    </Disclosure>,
  )
}

describe('Disclosure (WAI-ARIA disclosure pattern)', () => {
  it('starts collapsed with the region hidden', () => {
    renderDisclosure()
    const button = screen.getByRole('button', { name: 'Why a native button?' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    const region = button.getAttribute('aria-controls')
    const regionElement = document.getElementById(region!)
    expect(regionElement).toHaveAttribute('hidden')
  })

  it('links the button to a present region via aria-controls', () => {
    renderDisclosure()
    const button = screen.getByRole('button', { name: 'Why a native button?' })
    const regionId = button.getAttribute('aria-controls')
    expect(regionId).toBeTruthy()
    expect(document.getElementById(regionId!)).toHaveTextContent(
      'Because Enter and Space activation come for free.',
    )
  })

  it('toggles aria-expanded and reveals the region on click', async () => {
    const user = userEvent.setup()
    renderDisclosure()
    const button = screen.getByRole('button', { name: 'Why a native button?' })
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(button.getAttribute('aria-controls')!)).not.toHaveAttribute(
      'hidden',
    )
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById(button.getAttribute('aria-controls')!)).toHaveAttribute(
      'hidden',
    )
  })

  it('Enter toggles the disclosure from the keyboard', async () => {
    const user = userEvent.setup()
    renderDisclosure()
    const button = screen.getByRole('button', { name: 'Why a native button?' })
    await user.tab()
    expect(document.activeElement).toBe(button)
    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })
})