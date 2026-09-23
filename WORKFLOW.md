# WORKFLOW.md — Round One vs Round Two (Settings Form)

The same feature, "a settings form with validation," was built twice on independent branches:

- `feature/settings-form-vague` — prompt: *"Build a settings form with validation."* Output accepted without review.
- `feature/settings-form-precise` — prompt with specs, file references, an example behavior case, and an explicit verification step ("write it, then write tests and run them").

## Correctness

Round one's handler validated inline with checks like `email.includes('@')`, so `a@b` and `a@b@c` pass, missing top-level domains pass, and whitespace is never trimmed ("  Ann  " is stored raw). `maxResults` can be 0 or negative, displayName accepts one character, and password length is unchecked.

Round two moves validation into a pure `validateSettings()` module (`src/validate.js`) using a strict regex constant `EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/`, trims all strings, enforces displayName 2–40, password ≥ 8, an exact password-confirm match, a theme whitelist, and an integer 1–100 range. It returns `{ values, errors }`, so every rule is unit-testable: 14 `node:test` cases, all green.

## Accessibility

Round one has no `<label for>` association (a naked "Name: <input>"), and reports errors with `alert()` — invisible to most screen readers. Round two wires every field to a `<label>`, renders errors into inline `<p data-error-for>` elements marked `role="alert"`, and toggles `aria-invalid` plus `aria-describedby`. Verified in a browser: invalid submit shows inline messages and `[invalid]` states; valid submit shows "Saved."

## Edge cases

Round one silently accepts short passwords, mismatched confirmations, out-of-range numbers, non-integer `maxResults` ("twenty" → `NaN`), and bogus themes. Round two rejects 1-char names, 7-char passwords, emails missing `@` or domain dot, `maxResults` at 0, 101, 20.5, and `"twenty"` — each covered by a test. Its server also adds a MIME map (round one served `app.js` as `text/html`, which would break script loading) and a path-traversal guard behind `startsWith(ROOT)`.

## Review effort

Round one needed a full rewrite to be usable; since its defects were structural, patching in place was slower than rebuilding. Round two was reviewed once during verification, which surfaced two real bugs: `app.js` called `require()` in the browser (`ReferenceError: require is not defined`, caught in the console), and a global lexical collision between `const validateSettings` in `app.js` and `function validateSettings` in `src/validate.js` ("Identifier 'validateSettings' has already been declared"). Both were fixed in minutes because the pure-module design made the fix mechanical.

## AI mistakes caught

1. `email.includes('@')` accepted `a@b`, `a@b@c` (round one — accepted, never caught because I never ran it against adversarial input).
2. `require is not defined` in round two's browser bundle — caught by the verification step, not by reading the code.
3. Duplicate global `validateSettings` declaration — caught the same way.

## Effort

Round one: ~4 min to generate, but knowingly shipped broken (would take ~20 min to repair properly). Round two: ~15 min end-to-end, fully verified. The "slower" round was the faster one — the lesson this drill exists to teach.