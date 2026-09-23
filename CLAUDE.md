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