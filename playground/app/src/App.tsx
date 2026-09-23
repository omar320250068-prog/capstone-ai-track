import { useState } from 'react'
import { Dialog } from './components/dialog'
import { Tabs } from './components/tabs'
import { Disclosure } from './components/disclosure'

function App() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="page">
      <header className="page-header">
        <h1>A11y component playground</h1>
        <p>
          Hand-built React + TypeScript widgets following the WAI-ARIA Authoring Practices
          Guide. No component libraries — roles, focus and keyboard interaction are written
          from scratch. Try each one keyboard-only: <kbd>Tab</kbd>, <kbd>Shift+Tab</kbd>,{' '}
          <kbd>Escape</kbd>, and the arrow keys.
        </p>
      </header>

      <section className="demo" aria-labelledby="demo-dialog">
        <h2 id="demo-dialog">1 · Modal dialog</h2>
        <p>
          Focus moves into the dialog on open and is trapped inside. <kbd>Escape</kbd>{' '}
          closes and focus returns to the trigger button. The button below the trigger
          cannot be reached by <kbd>Tab</kbd> while the dialog is open.
        </p>
        <div className="button-row">
          <button type="button" className="button" onClick={() => setDialogOpen(true)}>
            Open dialog
          </button>
          <button type="button" className="button button-muted">
            Focus trap probe
          </button>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Update your profile"
          description="Trap test: cycle Tab until the ring wraps, then press Escape."
        >
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setDialogOpen(false)
            }}
          >
            <label className="field">
              <span>Display name</span>
              <input type="text" name="name" defaultValue="Omar" />
            </label>
            <div className="dialog-actions">
              <button type="submit" className="button button-primary">
                Save
              </button>
              <button type="button" className="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </Dialog>
      </section>

      <section className="demo" aria-labelledby="demo-tabs">
        <h2 id="demo-tabs">2 · Tabs</h2>
        <p>
          Roving tab index: only the active tab is in tab order. <kbd>→</kbd> /{' '}
          <kbd>←</kbd> move and select (automatic activation), <kbd>Home</kbd> /{' '}
          <kbd>End</kbd> jump to the edges, and <kbd>Tab</kbd> from a tab enters its panel.
        </p>
        <Tabs
          aria-label="Keyboard behavior tabs"
          items={[
            {
              label: 'Focus',
              content: <p>Arrow keys move the ring of tabs; the panel follows automatically.</p>,
            },
            {
              label: 'Roving tabindex',
              content: <p>Only one tab carries tabIndex={0} at a time, so Tab reaches the tablist once.</p>,
            },
            {
              label: 'Roles',
              content: <p>tablist / tab / tabpanel map to the WAI-ARIA tabs pattern.</p>,
            },
          ]}
        />
      </section>

      <section className="demo" aria-labelledby="demo-disclosure">
        <h2 id="demo-disclosure">3 · Disclosure</h2>
        <p>
          A single button toggles a region. <kbd>Enter</kbd> and <kbd>Space</kbd> both
          work because it is a real <code>button</code>: <code>aria-expanded</code> and{' '}
          <code>aria-controls</code> tell assistive tech which region it opens.
        </p>
        <div className="disclosure-stack">
          <Disclosure summary="What makes this a keyboard-safe component?">
            <p>
              It uses a native button element, so Enter and Space activation cost nothing,
              and the collapse/expand state is announced through aria-expanded.
            </p>
          </Disclosure>
          <Disclosure summary="When is a disclosure not an accordion?">
            <p>
              An accordion links several disclosures as one group (arrow keys move between
              them); a standalone disclosure is just one button and one region.
            </p>
          </Disclosure>
        </div>
      </section>

      <footer className="page-footer">
        Interactive keyboard verification runs in real browsers via Playwright; unit tests
        cover roles, roving tabindex and focus trapping.
      </footer>
    </div>
  )
}

export default App