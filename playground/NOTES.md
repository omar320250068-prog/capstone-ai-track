# NOTES — Hand-built vs shadcn/ui

Phase: **Foundations · Accessibility**
Date: 2026-09-23

Two apps in this playground:

- `app/` — the three components (dialog, tabs, disclosure) written **from
  scratch** in React + TypeScript against the WAI-ARIA Authoring Practices
  patterns, plus vitest + Testing Library suites and a real-browser
  keyboard-only verification script.
- `shadcn-comparison/` — the same two widgets (dialog, tabs) installed from
  shadcn/ui (`radix` preset) so the generated source can be read side by
  side.

## How the shadcn source was obtained

```
npm create vite@latest shadcn-comparison -- --template react-ts
npm install tailwindcss @tailwindcss/vite
# tailwind v4 vite plugin + tsconfig "@/*" alias, then:
npx shadcn@latest add dialog tabs -y
```

This produced `src/components/ui/dialog.tsx`, `tabs.tsx` and `button.tsx`
(bootstraps + theme CSS plus a `cn` util). The files were read in full and
are the basis for the comparison below.

## First observation: shadcn is a styling layer over Radix

The generated `dialog.tsx` is 168 lines and `tabs.tsx` is 87 lines, but
almost all of that is **Tailwind classes, `data-slot` markers and cva
variants**:

```tsx
// shadcn-comparison/src/components/ui/dialog.tsx
function DialogContent({ ... }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content data-slot="dialog-content" className={cn(...)} {...props}>
```

The accessibility machinery — focus trap, scroll lock, roving tabindex,
keyboard events, `aria-*` wiring — lives inside the `radix-ui` package and
is completely invisible in the generated source. shadcn's own responsibility
is ergonomics: `DialogTitle` / `DialogDescription` capture
`aria-labelledby` / `aria-describedby` for you, `<Button>` gets proper
focus and `focus-visible` styles.

My equivalent guards a few of these things in ~100 lines total and the rest
not at all — that asymmetry is the real lesson, broken out below.

## Concrete gaps in my hand-built versions (things shadcn/Radix handled that I missed)

### 1. Modal dialog does not lock background scroll

**Where:** `app/src/components/dialog.tsx` effect (open → set `inert`; close
→ clear). Nothing touches `document.body.style.overflow`.

Radix `Dialog` locks the page scroll while a modal is open. If my dialog
content is taller than the viewport, the background scrolls behind the
modal — a real modal should not.

### 2. My focus trap will happily focus a visually-hidden element

**Where:** `app/src/lib/focus.ts` — `getFocusableElements` selects by
selector only:

```ts
return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
```

Radix's focus guard ignores elements that are `display: none`,
`visibility: hidden`, disabled, or missing from the geometry, and it
actively re-verifies the focused node is in the trap. A `display:none`
button (common pattern) passes my selector; when the trap tries to focus it,
the browser refuses and the Tab cycle silently stalls — the user gets stuck.

### 3. Tabs: no vertical orientation and no RTL arrow mapping

**Where:** `app/src/components/tabs.tsx` `handleKeyDown` handles
`ArrowLeft`/`ArrowRight`/`Home`/`End` only, and the tablist sets no
`aria-orientation`.

WAI-ARIA requires a **vertical** tablist to respond to `ArrowDown`/
`ArrowUp`, and RTL documents to *swap* `ArrowLeft`/`ArrowRight`. Radix
`Tabs` implements both (`orientation="vertical"`, plus RTL-aware
`data-orientation`). My version is correct for LTR horizontal only.

### 4. Tabs: panel `tabIndex` is unconditional

**Where:** `app/src/components/tabs.tsx` — every panel is
`tabIndex={0}`:

```tsx
<div role="tabpanel" ... tabIndex={0} hidden={index !== activeIndex}>
```

APG says a tab panel should carry `tabIndex={0}` **only when it has no
focusable content**, so Tab doesn't stop at every panel unnecessarily.
Radix manages panel focusability (it can drop focus target when the panel
contains interactive content). Mine adds a redundant Tab stop.

### 5. No click-outside / Escape-on-overlay behavior, and no nested-modal story

Radix `Dialog` can be configured (`onInteractOutside`, `@dnd-kit`-style
prevent-defaults) and safely nests dialogs — the focus trap of the outer
modal keeps intercepting. Mine assumes exactly one dialog and offers no
outside-pointer dismiss; opening a second dialog while one is open is
undefined behavior (both share one portal root and only partially guard).

### 6. Composability and escape hatches (non-a11y but practical)

`asChild`, event callbacks (`onOpenAutoFocus`, `onCloseAutoFocus`,
`onEscapeKeyDown`) and `initialFocus` let callers override default focus
behaviour; mine bakes one policy in. `data-slot` attributes give testers
and themers stable selectors.

## Where my hand-built version does *more* than shadcn/Radix

Being fair to the exercise — these are things shadcn's generated code does
**not** do:

- I set `inert` on the entire background (`app/src/components/dialog.tsx`).
  Radix instead relies on `aria-modal="true"` + a focus trap; a browser that
  honors `inert` genuinely blocks focus *and* AT navigation of the
  background, which is stronger than aria-modal semantics alone.
- Focus is restored to the exact trigger button on close (verified in
  tests + Playwright); Radix restores to the previously focused element too,
  but only if it is re-mountable — mine re-focuses even after re-renders.
- The `inert`/trap/restore behaviour is fully covered by unit tests
  (`app/src/components/__tests__/*`) and a keyboard-only Playwright pass —
  shadcn ships components with no promise of test coverage.

## Verification summary (evidence)

Hand-built app — `npm test` (19 tests: roles, aria attributes, roving
tabindex, trap, Escape, focus return), `npm run lint`, `npm run build`, and
a 14-step real-browser keyboard-only run:

| Component | Keyboard script check | Result |
| --- | --- | --- |
| Dialog | Tab to trigger, Enter opens, 8×Tab stays trapped, Shift+Tab wraps, Escape closes + returns focus | pass |
| Tabs | Tab to tab, →/← activate + move focus, Home/End, Tab enters panel | pass |
| Disclosure | Tab to button, Space expands, Enter collapses | pass |

shadcn app — `npm run build` green; real-browser check: open focuses inside,
Escape returns to trigger, arrow/Home/End navigate tabs, roving `tabindex`
updates.

## Concrete actions taken

1. `inert` on background (stronger than aria-modal alone).
2. Focus trap + Escape + focus-return implemented per APG modal dialog.
3. Roving tabindex + automatic-activation arrow keys per APG tabs.
4. 19 unit tests + Playwright keyboard-only script as regression guards.

Open items if this learned-and-compared code went to production: Re-hook
scroll lock, switch `getFocusableElements` to a visibility-aware picker,
add vertical/RTL tabs, and pick a single modal at a time or document the
nesting policy.