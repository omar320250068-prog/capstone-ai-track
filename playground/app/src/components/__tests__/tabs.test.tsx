import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs } from '../tabs'

const ITEMS = [
  { label: 'Focus', content: <p>First panel</p> },
  { label: 'Roving tabindex', content: <p>Second panel</p> },
  { label: 'Roles', content: <p>Third panel</p> },
]

function renderTabs() {
  return render(<Tabs aria-label="Demo tabs" items={ITEMS} />)
}

describe('Tabs (WAI-ARIA tabs pattern)', () => {
  it('renders tablist, tabs and tabpanels with the correct roles', () => {
    renderTabs()
    expect(screen.getByRole('tablist', { name: 'Demo tabs' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(3)
  })

  it('uses roving tabindex: only the active tab is tabbable', () => {
    renderTabs()
    const [first, second, third] = screen.getAllByRole('tab')
    expect(first).toHaveAttribute('tabindex', '0')
    expect(second).toHaveAttribute('tabindex', '-1')
    expect(third).toHaveAttribute('tabindex', '-1')
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(second).toHaveAttribute('aria-selected', 'false')
  })

  it('ArrowRight activates the next tab and moves focus', () => {
    renderTabs()
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'ArrowRight' })
    const tabs = screen.getAllByRole('tab')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
    expect(document.activeElement).toBe(tabs[1])
  })

  it('ArrowLeft wraps backwards from the first to the last tab', () => {
    renderTabs()
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' })
    const tabs = screen.getAllByRole('tab')
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(tabs[2])
  })

  it('Home and End jump to the first and last tab', () => {
    renderTabs()
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'End' })
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(tablist, { key: 'Home' })
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('shows only the active panel and wires aria-controls/labelledby', () => {
    renderTabs()
    const [firstTab] = screen.getAllByRole('tab')
    const panels = screen.getAllByRole('tabpanel', { hidden: true })
    expect(panels[0]).not.toHaveAttribute('hidden')
    expect(panels[1]).toHaveAttribute('hidden')
    expect(panels[2]).toHaveAttribute('hidden')
    expect(panels[0]).toHaveAttribute('aria-labelledby', firstTab.id)
    expect(firstTab).toHaveAttribute('aria-controls', panels[0].id)
  })

  it('Tab from the active tab moves focus into its panel', async () => {
    const user = userEvent.setup()
    renderTabs()
    const firstTab = screen.getAllByRole('tab')[0]
    firstTab.focus()
    expect(document.activeElement).toBe(firstTab)
    await user.tab()
    expect(document.activeElement).toBe(screen.getAllByRole('tabpanel')[0])
  })

  it('clicking a tab selects it', async () => {
    const user = userEvent.setup()
    renderTabs()
    await user.click(screen.getAllByRole('tab')[2])
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('tabpanel', { hidden: true })[2]).not.toHaveAttribute('hidden')
  })

  it('has no focusable tabs when empty', () => {
    render(<Tabs aria-label="Empty" items={[]} />)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })
})