# CareerFlow — Agent Instructions

## General
- Follow existing architecture, conventions, and patterns.
- Inspect only task-relevant files; expand scope when necessary.
- Make minimal, focused changes. Avoid unrelated refactoring or new dependencies unless justified.
- Reuse existing components, utilities, and types.
- Do not modify unrelated files or revert existing user changes.

## Task-specific instructions

### Frontend UI
For UI tasks, follow `skills/careerflow-ui/SKILL.md`.
- Reuse `frontend/src/components` and existing variants.
- Use Tailwind utilities and established design tokens.
- Follow the skill's Figma and visual verification guidance when relevant.

### Frontend–backend integration
For API integration changes, debugging, or reviews, follow `skills/careerflow-api-contract/SKILL.md` and the relevant sections of `backend/apicontract.md`.
- Keep frontend wire types, endpoints, and backend DTOs consistent.
- Preserve documented status codes and error contracts.
- Update `backend/apicontract.md` when the implemented backend contract changes.

## Architecture
- API modules must not depend on components, pages, or hooks.
- Shared components must not depend on pages or make API requests; pass data and callbacks via props.
- Split code by responsibility. Avoid unnecessary abstractions and wrappers.

## Verification
For frontend code changes, run from `frontend`:
1. `npm run lint`
2. `npm run format:check`
3. `npm run build`

- Fix reported issues without disabling rules or adding ignore directives merely to pass checks.
- Use `npm run lint:fix` and `npm run format` when appropriate; rerun affected checks after fixes.
- Run relevant tests for behavioral changes.
- For backend-only or documentation-only changes, skip frontend checks unless affected.
- If verification cannot run or fails, report it accurately.

## Final response
Keep it concise: summarize changes, validation results, and blockers. Do not paste entire files or lengthy command output unless requested.
  