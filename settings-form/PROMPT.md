# Round 2 prompt

The exact prompt given to the AI: specs, file references, constraints, an example behavior case, and an explicit verification step. No context carried in from round one.

> Implement a "Settings" form under `settings-form/` in this repo using plain Node.js — no frameworks, no runtime npm dependencies.
>
> **Constraints**
>
> - `src/validate.js` exports one pure function `validateSettings(input)`. It returns `{ values, errors }`. `values` holds trimmed/coerced valid fields only; `errors` is an object whose keys belong to this set: `displayName`, `email`, `password`, `passwordConfirm`, `theme`, `maxResults`.
> - Field rules:
>   - `displayName`: required; 2-40 characters after trimming whitespace.
>   - `email`: required; must match the strict pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
>   - `password`: required; at least 8 characters.
>   - `passwordConfirm`: must equal `password`.
>   - `theme`: one of `"light"`, `"dark"`, `"system"`; default `"system"`.
>   - `maxResults`: required; integer between 1 and 100 inclusive; default 20; reject decimals, strings, and numbers outside the range.
> - `index.html`: every input is associated with a `<label>` via `for`; validation errors render into inline `<p data-error-for="<field>">` elements; the JS sets `aria-invalid` on invalid fields and `aria-describedby` pointing at the error; never use `alert()`. Include a dark-theme look.
> - `test/validate.test.js` uses the built-in `node:test` runner and `node:assert/strict`. Cover at minimum: fully valid input returns no errors and trimmed values; empty `displayName` rejected; 1-char `displayName` rejected; email missing `@` rejected; email missing `.` after the domain rejected; 7-char password rejected; mismatched `passwordConfirm` rejected; invalid `theme` rejected; `maxResults` of 0 rejected; `maxResults` of 101 rejected; non-integer `maxResults` rejected.
> - `package.json` scripts: `"test": "node --test"`, `"start": "node server.js"`. `server.js` serves `settings-form/` at `http://localhost:3000` with `Content-Type: text/html` for `.html` files.
>
> **Example behavior**
>
> `validateSettings({ displayName: "  Ann ", email: "ann@example.com", password: "secret123", passwordConfirm: "secret123", theme: "dark", maxResults: 25 })` → `{ values: { displayName: "Ann", email: "ann@example.com", theme: "dark", maxResults: 25 }, errors: {} }`.
>
> `validateSettings({ displayName: "", email: "nope" })` → `errors` with `displayName` and `email` present.
>
> **Verification step (do this after writing the code):**
>
> 1. Run `npm test` and make every test pass — fix any failures.
> 2. Run `npm start` and confirm the page loads at `http://localhost:3000` with labels present and error placeholders rendering.