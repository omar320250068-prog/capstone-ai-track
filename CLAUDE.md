# CLAUDE.md

Instructions and conventions for AI coding assistants (Claude Code, Cursor, opencode) working in this repository.

## Stack

- **Runtime:** Node.js (LTS, v24.x)
- **Language:** JavaScript / TypeScript (TypeScript preferred for type safety)
- **Version control:** Git (GitHub for remote hosting)
- **Editor:** Cursor (primary) and VS Code
- **AI assistant:** Claude Code and Cursor agents

## Conventions

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>[optional scope]: <description>
```

- Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`, `build`, `ci`.
- Imperative mood, lowercase, no trailing period: `feat: add user auth`.
- Add a scope when it helps: `feat(api): add `/health` endpoint`.
- One logical change per commit; commit early and often.

### Code

- Plain JavaScript or TypeScript, no framework unless a phase requires one.
- Use `npm` scripts defined in `package.json` for all project tasks.
- Keep `.gitignore` up to date; never commit secrets or build artifacts.
- Lint/format before committing.

### Workflow

1. Read this file and the README first.
2. Create a branch per feature for non-trivial work.
3. Verify changes locally before committing.

### AI assistant policies

- When asked to make a change, first read `README.md` and this file.
- Do not invent dependencies; check what is installed before proposing libraries.
- Never commit unless explicitly asked.

### Project rules (learned)

Testable, project-specific rules that should fail a review if violated:

1. **Forms validate through a pure module, never inline.** All form validation lives in a pure function returning `{ values, errors }` (see `settings-form/src/validate.js`) and is unit-tested with `node:test`. A DOM handler that contains validation logic — or any use of `alert()` for errors — fails review.
2. **Shared JS must bridge Node and the browser explicitly.** Files loaded by `<script>` must not `require()` CommonJS modules; a module that runs in both must expose `module.exports` for Node *and* a `window.*` global for the browser. A browser `ReferenceError: require is not defined` fails review.
3. **Email (and other field) rules use one named constant.** `EMAIL_RE` in `settings-form/src/validate.js` is the only email check; an `includes('@')`-style check anywhere fails review. Adding or changing a field rule requires adding a matching `node:test` case.
4. **Verify before shipping.** Every branch task must run its verification step (`npm test`; load the page and exercise it) and record the result before the commit is considered done.
5. **React forms follow the same pure-validator rule.** Validation lives in `settings-form-react/src/lib/validate.ts` (`{ values, errors }`); components only read it. Inputs get `aria-invalid` and `aria-describedby` only while an error exists, error `<p>` elements get `role="alert"` only while an error exists, and error ids come from `useId()` — hardcoded ids like `err-email` fail review.
6. **Vitest + Testing Library must register cleanup.** `src/test/setup.ts` contains `afterEach(cleanup)`; if forms stack up across tests ("Found multiple elements" in `getByRole`), the setup file was broken.
7. **No decimals in integer fields.** Use `Number(x)` + `Number.isInteger(x)`, never `parseInt(x, 10)` — `parseInt("20.5", 10)` returns `20` and silently accepts decimals.