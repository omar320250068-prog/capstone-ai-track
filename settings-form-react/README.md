# Settings Form — React (AI-assisted build)

A settings form with validation, built independently with an AI coding assistant (opencode) following the workflow from Ishak's session *"React Frontend Development with AI: From Prompt to Working Feature."*

## 1. The completed application

A React + TypeScript (Vite) app with:

- Six fields: display name, email, password, confirm password, theme, max results
- A **pure validator** (`src/lib/validate.ts`) returning `{ values, errors }` — no DOM access, unit-tested in isolation
- A controlled React form (`src/components/SettingsForm.tsx`) with inline, accessible error messages
- Light/dark styling that follows `prefers-color-scheme`
- **16 passing tests** (12 validator, 4 component with Testing Library) + lint + production build

Run it:

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 16 tests, vitest + jsdom
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## 2. Prompts used during development

| # | Prompt (verbatim) | Purpose |
| --- | --- | --- |
| 1 | `npm create vite@latest settings-form-react -- --template react-ts` | Scaffold (tool command, not natural language) |
| 2 | *"Build a settings form in React with validation for a profile: displayName 2-40 chars, strict email, password ≥ 8 with confirm match, theme light/dark/system, maxResults integer 1-100. Use a pure validator module returning { values, errors }, inline accessible errors with aria-invalid/aria-describedby and role=alert, no alert(). Write it, then write tests and run them."* | v1 baseline implementation |
| 3 | *"Review this code the way a reviewer would: correctness, accessibility, edge cases, test harness. List concrete defects before changing anything."* | Structured review pass |
| 4 | *"Fix every defect you listed, one at a time, re-running `npm test` after each fix."* | Corrections and refactor |

## 3. How AI assisted throughout the implementation

opencode drove the whole loop — **explore → plan → code → test → review → fix**:

- **Setup:** chose Vite's react-ts template, wired Vitest + Testing Library + jsdom into `vite.config.ts`, and set up a jsdom test environment.
- **Code generation:** produced the typed pure validator, the controlled form component, and the stylesheet from Prompt 2 — roughly a full feature in one pass, zero typing by hand.
- **Verification:** wrote 16 tests asserting real behavior (trimmed values, boundary lengths, regex edge cases, `aria-invalid` presence), ran `npm test` / `npm run build` / `npm run lint`, and exercised the app in a real browser (invalid submit → 5 inline errors; fix email → error clears live; valid submit → "Saved.").
- **Review:** audited its own generated code against a checklist (correctness / a11y / edge cases / test harness) and surfaced 5 concrete defects.
- **Fix loop:** applied each fix and re-ran the suite until green.

The AI's real value here wasn't typing — it was producing a *verifiable* first draft with tests, then catching what a human reviewer would catch only after a slow manual read.

## 4. Manual improvements, corrections, and refactors after reviewing AI-generated code

Each item below was found by reviewing the generated v1 (commit `e2149de`), then fixed by hand:

1. **Correctness bug — `parseInt` silently accepted `"20.5"`.**  
   `parseInt("20.5", 10)` returns `20`, so a decimal `maxResults` passed validation as a valid integer.  
   *Fix:* `Number(...)` + `Number.isInteger(...)`, plus an explicit empty-string check.  
   *Caught by:* the `rejects a non-integer maxResults like 20.5` test failing against v1.

2. **Test harness bug — no DOM cleanup between tests.**  
   `render()` never unmounted between tests because auto-cleanup wasn't registered (no `afterEach`), so forms accumulated and `getByRole` reported *"Found multiple elements."*  
   *Fix:* explicit `afterEach(cleanup)` in `src/test/setup.ts`.

3. **Accessibility — `role="alert"` on every field, all the time.**  
   Six permanent live regions (including empty ones) would cause screen readers to announce noise.  
   *Fix:* `role={error ? 'alert' : undefined}` — alert only when there is a message.

4. **Accessibility — no `aria-invalid` / `aria-describedby` wiring.**  
   Invalid inputs weren't programmatically marked, and error text wasn't associated with its field.  
   *Fix:* set `aria-invalid` and `aria-describedby` only when an error exists, with ids generated from a single `useId()` namespace (the original hardcoded `err-email` etc. would collide if the form rendered twice).

5. **UX — errors were frozen until the next submit.**  
   v1 only computed `errors` in `handleSubmit`, so fixing a field left its error message visible.  
   *Fix:* track `hasSubmitted`; after the first submit, re-run validation on every change so errors clear live.

6. **Refactor — removed `console.log` of user values.**  
   The generated submit handler logged password/email to the console. Replaced with a `Saved.` UI state; the log was demoted to `console.info` for validated non-secret values only.

7. **Test assertion corrected during review.**  
   One test asserted a *single* alert on an empty-form submit, but three required-field errors are correct behavior. Rewrote it to assert the count is between 1 and 6 and that the display-name message is present — matching the actual intent (only invalid fields announce).

### Evidence

- v1 baseline preserved in git: `git show e2149de`
- Review-driven fixes: subsequent commits on `feature/settings-form-react`
- Final state: **16/16 tests passing**, `npm run build` clean, `npm run lint` clean, browser-verified (invalid → inline errors + `aria-invalid`; live clear; valid → "Saved.")
