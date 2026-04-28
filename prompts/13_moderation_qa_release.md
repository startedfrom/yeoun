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

Implement the moderation, QA, and release-preparation layer. Add report flows for posts, comments, users, and messages, baseline bad-word filtering, rate limiting, and the minimum moderation or admin APIs needed for safe operations. Then add the key user-flow tests, finalize cron or job handling where required, connect error logging strategy, and prepare an Expo/EAS release checklist for iOS and Android distribution.

Constraints for this phase:

- Do not invent new product scope outside the source-of-truth docs.
- Keep the product clearly framed around mood and atmosphere rather than appearance scoring.
- Do not mark the app release-ready without real validation and release-prep artifacts.
- Stop after moderation, QA, and release preparation are stable.
