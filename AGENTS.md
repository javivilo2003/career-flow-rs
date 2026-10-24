# CareerFlow

For frontend UI work, read and follow [the CareerFlow UI skill](skills/careerflow-ui/SKILL.md). It documents the Figma source, design tokens, component variants, and verification workflow. Reuse `frontend/src/components` and keep styling in Tailwind utilities.

For work that adds, changes, debugs, or reviews communication between the frontend and backend, read and follow [the CareerFlow API contract skill](skills/careerflow-api-contract/SKILL.md). This includes frontend API modules and wire types as well as backend controllers, request/response DTOs, filters, enums, status codes, and error responses. Read `backend/apicontract.md` before making integration changes and keep it synchronized with the implemented backend contract.

## Required code checks

After writing or changing code, run `npm run lint` and `npm run format:check` from `frontend` and verify both exit successfully before finishing. Fix all reported errors; use `npm run lint:fix` and `npm run format` where appropriate, then rerun both checks after the final edit. Run `npm run build` for frontend code changes as well. Do not disable rules or add ignore directives merely to make checks pass. If an environment issue prevents a check from running, report the blocker explicitly and do not claim verification succeeded.

Keep API modules independent of components, pages, and hooks. Keep shared components independent of pages and API requests; pass data and callbacks as props. Split large files and functions by responsibility rather than adding arbitrary wrappers to satisfy limits.
