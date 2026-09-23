# Playground — WAI-ARIA components from scratch vs shadcn/ui

Read the comparison and findings first: **[NOTES.md](NOTES.md)**.

## Layout

| Folder | What it is |
| --- | --- |
| `app/` | Vite + React + TypeScript app with three hand-built components — modal dialog, tabs, disclosure — following the WAI-ARIA Authoring Practices Guide. No component libraries. Includes vitest + Testing Library suites and design-token-free plain CSS. |
| `shadcn-comparison/` | Vite app where shadcn/ui generated its dialog, tabs and button (`radix` preset) for source comparison. |

## Verify the hand-built app

```
cd app
npm install
npm test        # 19 unit tests (roles, roving tabindex, focus trap, Escape, focus return)
npm run lint
npm run build
npm run dev     # http://localhost:5173 — operate everything with the keyboard
```

Real-browser keyboard-only scenario (Tab, Enter, Escape, arrows, Home/End)
is what the tests encode; the same steps were driven in a real browser via
Playwright and recorded in `NOTES.md`.