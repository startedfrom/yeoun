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

Implement the profile and user settings layer centered on `user_profiles`. Add read and update support for nickname-safe profile data, profile image, bio, representative mood tags, account visibility, comment permission, and DM permission. Connect the Expo app's 무드카드 view and profile edit flow so these settings are visible and editable.

Constraints for this phase:

- Do not implement posts, reactions, or inbox flows yet.
- Avoid scattering authorization logic inside screen code; keep it reusable.
- Keep profile behavior aligned with the product vocabulary and privacy rules in the docs.
- Stop after profile and settings are stable.
