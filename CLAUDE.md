@AGENTS.md

## Claude Code notes

- `AGENTS.md` (imported above) is the single source of instructions for every agent. Put shared rules there, not here.
- If `node` or `pnpm` is missing in a non-interactive shell, Node is probably managed by nvm. Put the Node 24 bin directory on `PATH` (`nvm which 24` shows it) rather than installing another Node.
- Prisma blocks destructive commands (`migrate reset`) when an AI agent runs them, and requires the user's explicit consent. Ask the user; never bypass it.
- `make dev` runs long. Run it in the background and wait on the health endpoint (`curl localhost:3004/health`); don't sleep in a loop.
