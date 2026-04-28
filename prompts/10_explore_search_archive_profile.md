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

Implement 산책, search, archive, and the expanded 무드카드 experience. Support tag-based exploration, recommended users, search across the expected entities, saved-post archive behavior, profile post grids, and the display of the user's current 찰나 signal. The 산책 experience should feel like playful photo-first discovery rather than a generic utility list.

Constraints for this phase:

- Do not implement comments, follow flows, block logic, or inbox features yet.
- Keep the explore UI photo-first and branded.
- Do not reduce 무드카드 to a sterile generic profile page.
- Stop after discovery and personal archive/profile exploration are stable.
