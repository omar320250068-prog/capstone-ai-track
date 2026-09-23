import { useId, useState, type ReactNode } from 'react'

type DisclosureProps = {
  summary: ReactNode
  children: ReactNode
}

export function Disclosure({ summary, children }: DisclosureProps) {
  const regionId = useId()
  const [open, setOpen] = useState(false)

  return (
    <div className="disclosure">
      <h3 className="disclosure-heading">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={regionId}
          className="disclosure-button"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="disclosure-marker" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
          {summary}
        </button>
      </h3>
      <div id={regionId} className="disclosure-region" hidden={!open}>
        {children}
      </div>
    </div>
  )
}