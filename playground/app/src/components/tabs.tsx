import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export type TabItem = {
  label: string
  content: ReactNode
}

type TabsProps = {
  items: TabItem[]
  'aria-label': string
}

export function Tabs({ items, 'aria-label': ariaLabel }: TabsProps) {
  const baseId = useId()
  const [activeIndex, setActiveIndex] = useState(0)
  const tabRefs = useRef(new Map<number, HTMLButtonElement>())

  if (items.length === 0) return null

  const tabIds = items.map((_, index) => `${baseId}-tab-${index}`)
  const panelIds = items.map((_, index) => `${baseId}-panel-${index}`)

  const selectTab = (index: number) => {
    setActiveIndex(index)
    tabRefs.current.get(index)?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = items.length
    let next: number | null = null
    if (event.key === 'ArrowRight') next = (activeIndex + 1) % count
    else if (event.key === 'ArrowLeft') next = (activeIndex - 1 + count) % count
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = count - 1

    if (next !== null) {
      event.preventDefault()
      selectTab(next)
    }
  }

  return (
    <div className="tabs">
      <div role="tablist" aria-label={ariaLabel} onKeyDown={handleKeyDown} className="tabs-list">
        {items.map((item, index) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            id={tabIds[index]}
            aria-selected={index === activeIndex}
            aria-controls={panelIds[index]}
            tabIndex={index === activeIndex ? 0 : -1}
            ref={(element) => {
              if (element) tabRefs.current.set(index, element)
              else tabRefs.current.delete(index)
            }}
            onClick={() => setActiveIndex(index)}
            className="tabs-tab"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="tabs-panels">
        {items.map((item, index) => (
          <div
            key={item.label}
            role="tabpanel"
            id={panelIds[index]}
            aria-labelledby={tabIds[index]}
            tabIndex={0}
            hidden={index !== activeIndex}
            className="tabs-panel"
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  )
}