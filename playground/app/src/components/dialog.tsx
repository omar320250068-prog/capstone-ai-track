import { useId, useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { getFocusableElements } from '../lib/focus'

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
}

let portalRoot: HTMLDivElement | null = null

function getPortalRoot(): HTMLDivElement {
  if (!portalRoot) {
    portalRoot = document.createElement('div')
    document.body.appendChild(portalRoot)
  }
  return portalRoot
}

function trapFocus(event: KeyboardEvent, container: HTMLElement): void {
  const items = getFocusableElements(container)
  if (items.length === 0) {
    event.preventDefault()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (event.shiftKey && (active === first || active === container)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

export function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onOpenChangeRef = useRef(onOpenChange)

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  useEffect(() => {
    if (!open) return

    const previous =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousFocusRef.current = previous

    const root = getPortalRoot()
    for (const node of Array.from(document.body.children)) {
      if (node !== root) {
        ;(node as HTMLElement).inert = true
      }
    }

    const dialog = dialogRef.current
    if (dialog) {
      const first = getFocusableElements(dialog)[0]
      ;(first ?? dialog).focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChangeRef.current(false)
        return
      }
      if (event.key === 'Tab' && dialog) {
        trapFocus(event, dialog)
      }
    }

    dialog?.addEventListener('keydown', handleKeyDown)

    return () => {
      dialog?.removeEventListener('keydown', handleKeyDown)
      for (const node of Array.from(document.body.children)) {
        ;(node as HTMLElement).inert = false
      }
      previousFocusRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="dialog-backdrop">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="dialog"
      >
        <h2 id={titleId} className="dialog-title">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="dialog-description">
            {description}
          </p>
        ) : null}
        <div className="dialog-body">{children}</div>
      </div>
    </div>,
    getPortalRoot(),
  )
}