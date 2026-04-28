# Gamdojang Prompt Pack

## How To Use

1. Open one phase file at a time.
2. Copy the whole file content into your coding agent.
3. Wait for the implementation result.
4. Paste `prompts/review_gate.md` as the next message.
5. Only move to the next phase after the current one passes review.

## Important Rules

- Do not send multiple phase prompts at once.
- Each phase file is self-contained so it can work in a fresh chat.
- The review gate is intentionally separate; use it after the implementation response.

## Recommended Order

1. `01_expo_bootstrap.md`
2. `02_env_ci_rules.md`
3. `03_design_tokens_fonts.md`
4. `04_ui_primitives.md`
5. `05_app_shell_main_screens.md`
6. `06_auth_onboarding.md`
7. `07_profile_settings.md`
8. `08_posts_upload_chalna.md`
9. `09_reactions_feed.md`
10. `10_explore_search_archive_profile.md`
11. `11_comments_follow_block.md`
12. `12_inbox_notifications.md`
13. `13_moderation_qa_release.md`

## Notes

- These prompts are written for a real React Native + Expo app, not a mobile web MVP.
- They assume the source-of-truth docs live at the workspace root.
- If the repository already contains code, the agent should extend the existing structure instead of rebuilding from scratch.
