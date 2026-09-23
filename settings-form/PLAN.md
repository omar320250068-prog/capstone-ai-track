# Plan (round 2)

Explore → Plan → Code → Test loop used for round two.

## Explore

- Repo is plain Node.js, no framework (per CLAUDE.md). Node v24 LTS → built-in `node:test` runner is available, so zero new dependencies.
- Existing convention: `npm` scripts in `package.json`, features on their own branch.

## Plan

1. `src/validate.js` — pure `validateSettings(input)` → `{ values, errors }`. No DOM access → trivially testable.
2. `test/validate.test.js` — `node:test` + `node:assert/strict`, one test per rule, plus a full-pass case.
3. `index.html` — labels with `for`, inline `<p data-error-for>` errors, `aria-invalid` / `aria-describedby`, dark-theme styling, no `alert()`.
4. `server.js` + `package.json` — static serving on `:3000`, scripts `test` and `start`.

## Test

- `npm test` green; then `npm start`, load `http://localhost:3000` in a browser, submit bad input, confirm inline error appears (not an alert).