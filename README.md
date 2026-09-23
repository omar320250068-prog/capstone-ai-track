# Capstone: AI-Assisted Development Track

Capstone project for the **AI-Assisted Development Track** — a structured program for mastering AI-assisted engineering: reliable toolchains, effective prompting, and AI pair-programming workflows baked into everyday development.

## Status

Phase: **Foundations · deployment** — `capstone-app/` is scaffolded, verified, and served at a live preview (see `deliverables/DEPLOYMENT.md`).

## Toolchain

| Tool | Purpose | Status |
| --- | --- | --- |
| Node.js (LTS v24.x) | Runtime for the capstone | Installed |
| Git + GitHub | Version control, remote hosting | Installed |
| Cursor / VS Code | Primary editor and IDE | Installed |
| Claude Code | AI assistant in the terminal | Installed |
| Conventional Commits | Commit message format | In use |

## Getting Started

1. Have a recent LTS Node.js and Git installed.
2. Open this repository in Cursor or VS Code.
3. Read `CLAUDE.md` for stack details and conventions.
4. Run your AI assistant to confirm it can access the project context.

Check `git log` — this repo is built by incremental, conventional commits.

## Roadmap

- [x] Phase Setup: toolchain, repo scaffold, `CLAUDE.md`, three commits
- [x] Phase Foundations · drill: settings form built twice (`settings-form/`, `WORKFLOW.md`)
- [x] Phase Foundations · assignment: React app built with AI (`settings-form-react/`)
- [x] Phase Foundations · deployment: Next.js app + health check + live preview (`capstone-app/`, `deliverables/DEPLOYMENT.md`)
- [x] Phase Foundations · a11y: hand-built dialog, tabs, disclosure + keyboard tests + shadcn comparison (`playground/`, `playground/NOTES.md`, on `feature/a11y-playground`)
- [x] Phase Build (core): streaming chat — token-by-token, thinking handoff, stop, pinned auto-scroll, mock-or-Claude backend (`capstone-app/`, `deliverables/CHAT.md`)
- [ ] Permanent Vercel/Netlify deploy (needs account login)

## License

[MIT](LICENSE)