<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Intam collaboration rules

- Read `docs/architecture/README.md` before changing module boundaries.
- Use the ownership and independent-review roles in `docs/team/roles.md` when delegating work.
- Measure optimization work against `docs/performance/budgets.md` and run `npm run verify`.
- Do not add new maps or minigames to `src/game/createLearningGame.ts`; create a feature-owned module.
- Keep editable image sources separate from generated runtime assets. Regenerate runtime WebP files with `npm run assets:optimize`.
- Preserve uncommitted artwork and generated experiments unless the user explicitly approves moving or deleting them.
