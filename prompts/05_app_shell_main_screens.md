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

Create the mobile app shell and main screen shells in `apps/mobile`. Set up the global layout, tab navigation, shared header behavior, and screen routing for `홈`, `산책`, `업로드`, `편지함`, `무드카드`, and `설정`. Use mock data only and make the app feel branded from first launch, while keeping photos central and the UI distinct from generic SNS patterns.

Constraints for this phase:

- Do not implement auth, upload processing, reactions, or real API fetching.
- Do not skip the app shell and jump straight into feature logic.
- Keep the screens clickable and navigable, but still mock-driven.
- Stop after the screen shell flow is stable.
