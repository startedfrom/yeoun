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

Implement the core 여운 reaction system and the home feed. Add one-user-one-reaction behavior, reaction updates, average paw score calculation, representative label calculation, and feed DTOs for `추천`, `최신`, and `팔로우`. Add the 찰나 strip and connect the Expo app's home feed cards and post detail views to these results.

Constraints for this phase:

- Do not jump into search, bookmarks, comments, or messaging yet.
- Keep the reaction model distinct from likes or star ratings in both naming and UX.
- Use server-calculated aggregates where the docs call for them.
- Stop after the core reaction and feed experience is stable.
