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

Implement the posts and upload layer using `posts`, `post_images`, and `post_mood_tags`. Support creation, read, update, and delete for both regular posts and 찰나. In the Expo app, add image selection, preview, caption, mood tag input, visibility selection, and 찰나 duration choice. Enforce the product rules: regular posts allow 1 to 4 images, 찰나 allows exactly 1 image, and 찰나 supports 12h or 24h expiration.

Constraints for this phase:

- Do not implement reaction scoring or feed ranking yet.
- Do not skip the input validation and product constraints.
- Keep upload and detail flows mobile-first and production-minded.
- Stop after post and 찰나 CRUD are stable end-to-end.
