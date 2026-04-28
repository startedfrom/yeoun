You are implementing the Gamdojang mobile app based on these source-of-truth documents at the workspace root:

- `gamdojang_codex_prompt.md`
- `gamdojang_design_system.md`
- `gamdojang_ia.md`
- `gamdojang_db_api.md`

Read them first and use them as the product and architecture baseline.

This is a real iOS/Android React Native app built with Expo. Do not solve this as a mobile web app or a Next.js app.

Preferred stack:

- Expo + TypeScript + Expo Router
- TanStack Query
- Zustand
- Zod + React Hook Form
- Expo Secure Store
- Prisma + PostgreSQL
- pnpm workspace

Hard rules:

- Implement only the scope of this phase.
- Do not prebuild next-phase features.
- Keep Gamdojang vocabulary intact.
- Respect the existing repository structure if code already exists.
- Use reusable structure over ad hoc setup.
- If something is out of scope, put it in `Remaining TODO` instead of implementing it.

Completion requirements:

- Run lint and make it pass.
- Run relevant tests and report the real result.
- Run typecheck and build when applicable.
- Do not claim completion if validation failed.
- Final response must include `Changed files`, `Commands run`, `Validation result`, `Remaining TODO`, and `Assumptions`.

Phase task:

Set up repository-level environment configuration, `env.example`, environment loading strategy, GitHub Actions CI, and shared engineering rules. Define the common product vocabulary, enums, API prefix, standard error response format, and baseline authorization rules in a durable location such as `docs` or `packages/config`.

Constraints for this phase:

- Do not implement domain features.
- Do not add auth flows, feed logic, or UI beyond what is needed to support config and engineering rules.
- Stop after the environment, CI, and shared rule baseline is stable.
