# CareerFlow QA report

## Final post-CF-P5-01 independent re-review — 2026-10-28

### Final assessment (supersedes the prior Phase 5 FAIL below)

**PASS** — CF-P5-01 is resolved. The full frontend unit/component suite, all mocked-API Chromium
journeys, the explicit 390×640 no-page-overflow assertion, lint, format check, and production build
all pass. Docker subsequently became available, and the orchestrator ran the full backend suite
through its default Testcontainers path: 182 tests with no failures, errors, or skips and
`BUILD SUCCESS` in 45.527s. No open release-blocking defect was found in this re-review.

The earlier **FAIL** at the end of the next section is retained as historical defect evidence only;
it is no longer the current release recommendation.

### Scope and evidence levels

- Independently inspected the integrated `AppHeader` and `HistoricalAnalysisSection` corrections.
  The primary navigation now wraps at narrow widths instead of establishing a page wider than the
  viewport. Historical analytics cards and their grids explicitly permit shrinking, while the
  activity table keeps any horizontal overflow local to its dedicated container.
- Re-ran every configured frontend unit/component and browser test, not only the previously failing
  Progress case. The Progress journey executes in real Chromium at 390×640 and requires both
  `documentElement.scrollWidth === clientWidth === 390` and an empty list of elements extending
  beyond the viewport. It then repeats the short-height check at 1280×480 and status navigation.
- Vitest uses jsdom with mocked API functions. Playwright uses real Chromium and the real Vite UI,
  but intercepts `/api` with an isolated in-memory fixture. These are **mocked-backend browser**
  journeys, not live browser-to-Spring end-to-end tests.
- The orchestrator reran the unchanged backend with Docker available using
  `cd backend && ./mvnw test`. The default Testcontainers path completed successfully: 182 tests,
  zero failures, errors, or skips, and `BUILD SUCCESS` in 45.527s.
- No separate approved implementation-plan document exists under `docs`; this re-review used the
  CF-P5-01 correction request, the maintained API contract, UI skill, and existing acceptance tests.

### Final results

| Classification | Area | Result and evidence |
| --- | --- | --- |
| Passed | CF-P5-01 mobile overflow | Chromium at 390×640 reported exactly 390px client/scroll widths and no overflowing offender. Header navigation, funnel, activity, duration, custom controls, and status navigation remained operable. |
| Passed | Frontend regression | 24/24 Vitest tests in 9 files and 3/3 Playwright Chromium journeys passed, including creation, full-resource status persistence, URL context, timeline, Progress, keyboard controls, 390×640 mobile, and 1280×480 short viewport coverage. |
| Passed | Frontend quality gates | ESLint completed with zero warnings, Prettier found all files formatted, and TypeScript/Vite built successfully with 120 modules transformed. |
| Passed | Backend regression and Testcontainers | Docker-backed default `./mvnw test`: 182 tests, 0 failures, 0 errors, 0 skips; `BUILD SUCCESS` in 45.527s. |
| Failed | Current verification | None. The formerly failing 390×640 assertion now passes. |
| Not tested | Live browser/backend integration | No Chromium journey targeted a running Spring service; proxy behavior, actual browser/server serialization, and cross-process failure behavior remain outside this pass. |
| Not tested | Additional manual/accessibility breadth | No screen reader or axe audit was run. Company/contact create-edit-association browser journeys and exhaustive device/browser coverage were not repeated; existing lower-level and prior Phase 1–4 evidence remains applicable. |

### Commands and actual results

- Frontend `npm test` — **PASS**, 24 tests in 9 files.
- Frontend `npm run test:e2e` — **PASS**, 3 tests in Chromium. The Progress test includes the
  strict 390×640 overflow assertion and the 1280×480 short-viewport check.
- Frontend `npm run lint` — **PASS**, zero warnings.
- Frontend `npm run format:check` — **PASS**.
- Frontend `npm run build` — **PASS**, TypeScript/Vite production build, 120 modules transformed.
- Backend `cd backend && ./mvnw test` (orchestrator execution) — **PASS**, default Testcontainers
  path; 182 tests / 0 failures / 0 errors / 0 skips; `BUILD SUCCESS` in 45.527s.
- Repository `git diff --check` — **PASS**.

### Defect disposition and remaining risks

- **CF-P5-01 (MEDIUM): RESOLVED.** Reproduction at 390×640 no longer creates page-level
  horizontal overflow. Suggested owner verification is complete in Chromium.
- No new defect was found. The browser fixture proves frontend rendering and orchestration with
  deterministic mocked responses, while backend contract and PostgreSQL behavior are independently
  tested; it does not prove a live frontend-to-Spring deployment.
- The earlier Docker/Testcontainers block retained in the historical sections below is superseded
  by the successful default Testcontainers run and is historical context only.
- Browser coverage is Chromium-only. Manual assistive-technology testing and broader responsive
  device/browser sampling remain unexecuted.

### Files changed by this re-review

- `docs/careerflow-implementation/qa-report.md` only. No production or automated test file was
  modified.

## Prior Phase 5C and full Phase 5 verification — 2026-10-28 (superseded)

### Scope and evidence levels

- Added backend controller and real-PostgreSQL analytics coverage for explicit-event funnel
  semantics, instrumented cohort/legacy coverage, submitted denominators and null rates, inclusive
  UTC bounds, independent activity facts, sparse daily buckets, earliest repeated-stage duration,
  median/sample honesty, invalid ranges, and V5 index definitions/query-plan use.
- Added frontend API/component coverage for 30/90/all/custom periods, custom validation,
  loading/error/retry/empty output, funnel/rates/coverage, activity, duration, and exact transport
  behavior. The mocked Chromium Progress journey also preserves the current Applications and
  Interviews sections and verifies status-metric navigation.
- **Evidence distinction:** JUnit integration tests used PostgreSQL 18.6 with Flyway V1–V5 on fresh
  temporary databases. Vitest used jsdom and mocked API functions. Playwright used real Chromium
  against the Vite application with an isolated in-memory route fixture, not a running Spring
  server. No live frontend-to-Spring browser claim is made.

### Results

| Area | Result | Evidence |
| --- | --- | --- |
| Analytics service and PostgreSQL query semantics | **Passed** | Explicit OFFER without APPLIED/INTERVIEWING does not infer either stage; legacy rows are excluded from cohort but reported in coverage; submitted-only numerators produce `0.5000` rates; repeated APPLIED uses the earliest event; two 5h/9h sequences produce median 7h/sample 2. |
| UTC boundaries/activity/daily buckets | **Passed** | `2026-08-10T00:00Z` is included and `2026-08-15T00:00Z` excluded for an Aug 10–14 range. Created/APPLIED/genuine-transition totals are asserted independently and inactive dates are omitted. |
| Missing history and invalid input honesty | **Passed** | OFFER-only cohort returns zero submitted, null rates, null median, sample 0. Reversed ranges and malformed dates return documented `400 INVALID_REQUEST`; reversed message is exact. |
| V5 migration | **Passed** | Fresh Flyway run reached V5. All three indexes exist with expected predicates/columns; PostgreSQL `EXPLAIN` uses each index for its representative analytics predicate with sequential scans disabled. |
| Frontend API and component behavior | **Passed** | 24 Vitest tests in 9 files pass, including all presets, exact custom values, client validation, loading/error/retry/empty, denominators, legacy coverage, sparse table, and duration sample. |
| Progress current-state preservation/navigation | **Passed in mocked browser** | Current Applications totals, all status links, Interviews status section, historical sections, and `/applications?status=INTERVIEWING` navigation rendered/worked in Chromium. |
| Desktop and short-viewport browser behavior | **Passed** | Existing journeys passed at Desktop Chromium; Progress remained operable at 1280×480 and its duration section remained visible. |
| Keyboard and semantic accessibility | **Passed with limitations** | Real Chromium Enter/Tab operated All history and Custom with visible focus targeting; component tests assert status/alert/table accessible names. No screen reader or automated axe audit was run. |
| Mobile responsive layout | **Failed — CF-P5-01** | At 390×640 the document is 694px wide. Primary-nav Contacts/Interviews and Progress content extend beyond the viewport. |
| Live browser/backend integration | **Not tested** | Browser fixture mocked `/api`; serialization/network integration is covered separately, not end-to-end. |
| Additional company/contact browser journeys | **Not tested** | Existing creation/status journeys remained; company/contact create-edit-association journeys were not added in this pass. Their lower-level Phase 1–4 coverage remains applicable. |

### Defect CF-P5-01 — mobile page horizontally overflows

- **Severity:** MEDIUM.
- **Affected feature:** Shared primary navigation and Progress responsive layout.
- **Responsible owner:** orchestrator/shared frontend owner (with Progress owner verifying after the
  shared header correction).
- **Reproduction:** open `/dashboard` at 390×640 with analytics loaded; inspect document width or
  pan horizontally.
- **Expected:** document width remains 390px; wide activity table scrolls only inside its dedicated
  container; all primary navigation remains available without page-level horizontal scrolling.
- **Actual:** `documentElement.clientWidth=390`, `scrollWidth=694`. Measured overflow includes
  Contacts (`right=438`), Interviews (`right=543`), and the funnel article (`right=694`). The header
  establishes the wider page and Progress cards expand to that width.
- **Evidence:** failing soft assertion in `frontend/e2e/applications.spec.ts`; retained screenshot
  and trace under `frontend/test-results/applications-Progress-pres-095ad-onsive-historical-analytics-chromium/`.
- **Suggested verification:** rerun the Progress Playwright journey at 390×640 and 1280×480; require
  `scrollWidth === clientWidth`, no elements beyond the viewport except the activity table inside
  its local overflow container, and repeat keyboard navigation.

### QA-owned files

- `backend/src/test/java/app/careerflow/rs/analytics/controller/AnalyticsControllerTest.java`
- `backend/src/test/java/app/careerflow/rs/analytics/service/AnalyticsPostgresIntegrationTest.java`
- `frontend/tests/unit/analyticsApi.test.ts`
- `frontend/tests/components/HistoricalAnalysisSection.test.tsx`
- `frontend/e2e/applications.spec.ts`
- `docs/careerflow-implementation/qa-report.md`

### Commands and actual results

- Frontend `npm run lint` — **PASS**.
- Frontend `npm run format:check` — **PASS**.
- Frontend `npm run build` — **PASS**, TypeScript/Vite production build, 120 modules transformed.
- Frontend `npm test` — **PASS**, 24 tests in 9 files.
- Frontend `npm run test:e2e` — **FAIL**, 2 passed and 1 failed in Chromium solely on CF-P5-01;
  the soft assertion allowed subsequent custom-control, short-viewport, and navigation assertions
  to execute without another failure.
- Backend focused controller run — **PASS**, 3 tests.
- Backend focused analytics run against a fresh local PostgreSQL database with Testcontainers
  disabled and explicit datasource properties — **PASS**, 7 tests total across controller and
  integration suites.
- Backend full `./mvnw -q -Dtestcontainers.enabled=false` suite with explicit datasource properties
  against a second fresh PostgreSQL database — **PASS**, 182 tests in 49 suites, 0
  failures/errors/skips. The temporary database was dropped after execution.
- Repository `git diff --check` — **PASS**.

### Readiness

**FAIL** — Phase 5 analytics semantics, contracts, migration behavior, frontend states, current-state
preservation, keyboard operation, and broad backend regression are verified. Release readiness is
withheld because an actual Chromium responsive check found reproducible page-level mobile overflow.
After CF-P5-01 is corrected, rerun Playwright plus frontend lint/format/build; no analytics backend
defect or backend blocker remains.

## Phase 5B integrated application timeline verification — 2026-10-28

### Scope and full-stack distinctions

- Independently reviewed the integrated application-history endpoint, frontend API adapter,
  `useApplicationHistory`, activity timeline, application-detail integration, and timestamp wire
  fields against the API contract.
- Added QA-owned Vitest coverage for chronological rendering, initial-event de-duplication, honest
  legacy-empty-history explanation, localized visible timestamps with semantic `<time>` values,
  accessible timeline/loading/error output, retained events during refresh, and independent
  history failure/retry.
- Added API adapter tests for encoded IDs, unchanged event payloads, documented error envelopes,
  and malformed-error fallback behavior.
- Extended the stateful Playwright API fixture with application timestamps and status-history
  persistence. The browser journey now verifies that a successful status change appears in the
  detail timeline while the description and Opportunity details remain available.
- **Runtime distinction:** Vitest uses jsdom and mocked API functions; Playwright uses real Chromium
  with a mocked HTTP fixture; backend persistence tests use real local PostgreSQL 18.6. No browser
  journey was run against a live Spring Boot server, so the mocked E2E pass is not described as a
  live full-stack pass.

### Results

| Area                                             | Result         | Evidence                                                                                                                                                                                                     |
| ------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Timeline chronology/de-duplication/legacy output | **Passed**     | Component tests render deliberately unordered events oldest-first, collapse the nullable-previous-status event into one creation item, and explain empty legacy history without inventing an initial status. |
| Localized and accessible output                  | **Passed**     | Visible timestamp equals the active `Intl.DateTimeFormat` result; `<time dateTime>` preserves the ISO instant; timeline accessible name and loading/error live roles are asserted.                           |
| History hook isolation/retry                     | **Passed**     | Prior events remain visible during refresh; failure is local to activity; retry clears the error and renders recovered history.                                                                              |
| Frontend API contract                            | **Passed**     | Encoded `/api/applications/{id}/history`, exact array payload, `404 NOT_FOUND`, and malformed `500` fallback are automated.                                                                                  |
| Mocked browser integration                       | **Passed**     | 2 Chromium journeys passed. Status PUT preserves the complete application, the mocked history endpoint records the transition, and details show both description and Saved-to-Applied activity.              |
| Backend history contract/persistence             | **Passed**     | Existing focused service/controller/PostgreSQL suites cover order, nullable initial status, exact transition rules, rollback, legacy rows, migration types, and cascade.                                     |
| Full backend regression                          | **Passed**     | Fresh temporary PostgreSQL database: 175 tests across 47 suites, 0 failures/errors/skips.                                                                                                                    |
| Live frontend-to-Spring browser journey          | **Not tested** | Browser automation used the isolated route fixture rather than a running backend.                                                                                                                            |
| Responsive/manual assistive-technology review    | **Not tested** | Automated semantic assertions and Desktop Chromium ran; mobile layout and a screen reader were not exercised.                                                                                                |

### QA files

- `frontend/tests/components/ApplicationActivity.test.tsx`
- `frontend/tests/unit/useApplicationHistory.test.tsx`
- `frontend/tests/unit/applicationsApi.test.ts`
- `frontend/e2e/applications.spec.ts` (timestamp/history fixture and timeline assertion)

### Commands and actual results

- Frontend `npm test` — **PASS**, 19 tests in 7 files.
- Frontend `npm run test:e2e` — **PASS**, 2 tests in Desktop Chromium.
- Frontend `npm run lint` — **PASS**.
- Frontend `npm run format:check` — **PASS**.
- Frontend `npm run build` — **PASS**, TypeScript/Vite build, 118 modules transformed.
- Backend targeted
  `./mvnw -q -Dtest='ApplicationStatusHistoryServiceTest,ApplicationStatusHistoryControllerTest' test`
  — **PASS**, 4 tests, 0 failures/errors.
- Backend full suite against a fresh temporary local PostgreSQL database with Testcontainers
  disabled and explicit datasource properties — **PASS**, 175 tests in 47 suites, 0
  failures/errors/skips; the temporary database was dropped after execution.
- One attempted Maven exclusion-selector invocation matched no tests and exited before execution;
  it is a command-selection error, not a product test failure, and was superseded by the full
  PostgreSQL suite above.
- Repository `git diff --check` — **PASS**.

### Defects, risks, and recommendation

- No unresolved Phase 5B functional defect was found in the integrated implementation.
- The mocked browser fixture validates frontend orchestration but cannot prove live proxy/network,
  JSON serialization, or server/browser integration. Backend contract and PostgreSQL behavior are
  independently automated, which narrows but does not eliminate that gap.
- No separate approved implementation-plan document was present under
  `docs/careerflow-implementation`; verification used the requested Phase 5B criteria and current
  maintained API contract.
- **PASS** — the integrated Phase 5B acceptance behavior is covered at component, hook, API,
  mocked-browser, backend contract, and real-PostgreSQL levels, with the live browser/backend and
  manual responsive/accessibility distinctions explicitly not claimed.

## Phase 5A automated verification preparation — 2026-10-28

### Scope and current result

- Added Vitest/Testing Library specifications for application URL normalization and context
  preservation, local date-only boundaries, company-combobox keyboard behavior, required-field
  validation, inline-company failure/retry draft preservation, automatic new-company selection,
  and duplicate application-submit suppression.
- Added deterministic Playwright journeys backed by an isolated, stateful API route fixture. They
  cover first-application creation with a new company and complete-resource status persistence,
  filter page reset, and preservation of unrelated URL context without requiring a live backend.
- Inspected the existing backend JUnit/controller/service/PostgreSQL coverage. Phase 1–4 already
  cover the relevant API contracts and persistence predicates; no duplicative Phase 5A backend
  test was added.

### Test interface and orchestrator configuration request

The frontend currently has no test dependencies or scripts. The orchestrator must add these exact
development dependencies (versions should be selected compatibly with the current Node/Vite 8
toolchain): `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`,
`@testing-library/jest-dom`, and `@playwright/test`.

Requested `frontend/package.json` scripts:

```json
"test": "vitest run --config tests/vitest.config.ts",
"test:watch": "vitest --config tests/vitest.config.ts",
"test:e2e": "playwright test --config e2e/playwright.config.ts"
```

After installation, provision Chromium once with `npx playwright install chromium`. QA-owned
configuration and setup live under `frontend/tests/` and `frontend/e2e/`; no shared Vite,
TypeScript, ESLint, package, or lockfile configuration was changed.

### Execution status

| Area                                 | Result                                        | Evidence                                                                                                                                                          |
| ------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest component/unit suite          | **Blocked**                                   | Required runner, jsdom, and Testing Library packages are not present in `frontend/package.json`/`node_modules`; dependency ownership belongs to the orchestrator. |
| Playwright mocked-API journeys       | **Blocked**                                   | `@playwright/test` and its Chromium binary are not installed. The journeys are deterministic and do not require PostgreSQL once provisioned.                      |
| Live-backend browser journey         | **Not tested**                                | No browser runner is installed and no safe isolated live database was available. Mock journeys must not be represented as live full-stack verification.           |
| PostgreSQL/Testcontainers regression | **Blocked (existing environment limitation)** | Docker remains unavailable; existing Phase 2–4 query integration specifications could not be executed against PostgreSQL.                                         |

### Commands and actual results

- Frontend `npm run build` — **PASS**, TypeScript/Vite production build, 115 modules transformed.
- Frontend `npm run format:check` — **PASS** after formatting the new QA assets.
- Frontend `npm run lint` — **BLOCKED/FAIL**, because the new test imports cannot be resolved until
  the requested Vitest, Testing Library, and Playwright dependencies are installed. The resulting
  type-aware unsafe-resolution diagnostics are dependency failures, not executed test results.
- Backend targeted non-Docker regression command covering Phase 1/2 company/application contracts
  and follow-up controller behavior — **PASS**, 27 tests, 0 failures/errors/skips.
- Repository `git diff --check` — **PASS**.

### Remaining risks and release recommendation

- Browser focus containment/restoration, native dialog behavior, responsive layout, and real
  browser accessibility remain unexecuted until Playwright is installed.
- Mock route tests verify frontend requests and state transitions but do not replace live Spring
  Boot/PostgreSQL compatibility checks.
- **BLOCKED** — Phase 5A assets are prepared, but automated frontend execution and browser
  evidence require orchestrator-owned dependency installation; PostgreSQL checks still require
  Docker.

## Phase 4 final integrated assessment — 2026-10-27

### Scope and method

- Independently inspected the integrated backend identity contract, follow-up API adapter and
  application-detail workflow, Applications attention summary, Progress page, header/routing,
  interview refinements, and the affected Phase 1–3 flows.
- Used backend controller/service/mapper automation, a broad non-Docker regression suite,
  frontend lint/format/typecheck/build, API-contract tracing, and deterministic static state-flow
  review. No frontend runner or browser automation is configured, so static review is not
  represented as browser execution.

### Results

| Area                                       | Result                                         | Evidence                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Follow-up backend identity and mutations   | **Passed**                                     | The DTO/controller/service/mapper expose and return the persisted `id`; POST returns `201` with the persisted resource; PUT is a full update preserving the response identity and supporting reassociation/completion. Targeted coverage is included in the 152-test non-Docker pass.                                                                                                            |
| Follow-up frontend contract                | **Passed by static inspection**                | `FollowUpResponse` exactly matches `{ id, applicationId, title, dueDate, completed }`; `followUpFromResponse` explicitly maps `applicationId` to `jobApplicationId`; list, GET, POST, and PUT all use the adapter and shared error envelope.                                                                                                                                                     |
| Application follow-up workflow             | **Passed by static inspection**                | Create/edit retain drafts on failure, one mutation is allowed at a time, successful responses update by persisted ID, full PUT fields are sent, completion moves an item between local outstanding/completed groups, due-date comparisons use local `YYYY-MM-DD`, and missing records are removed locally.                                                                                       |
| Attention contents and isolation           | **Passed by static inspection**                | Pending follow-ups are requested through inclusive `dueDateTo=today`; scheduled/rescheduled interviews use inclusive `interviewDateFrom=today`; resources load and retry independently and their failures do not block the Applications list. Successful follow-up/interview mutations now invalidate both attention resources; failed or blocked mutations return `null` and do not invalidate. |
| Progress                                   | **Passed by static inspection**                | Total and all seven application-status counts use authoritative `totalElements`; interviewing/offer metrics derive from those counts; every status metric links to `/applications?status=...`; interview summaries cover all seven interview statuses; no historical placeholder analytics remain.                                                                                               |
| Interview refinements                      | **Passed by static inspection**                | Upcoming is exactly scheduled/rescheduled with non-null date from local today; history contains the complement including undated/finished records; merged pagination fetches sufficient per-status prefixes; date-only formatting avoids UTC conversion.                                                                                                                                         |
| Applications/header/navigation integration | **Passed by static inspection**                | Applications remains the index route and first navigation item; Dashboard is presented as Progress; attention detail links retain current list query and origin state and target the relevant detail section.                                                                                                                                                                                    |
| Phase 1–3 regression                       | **Passed by automation and static inspection** | The broad non-Docker suite passed 152 tests. Existing creation preservation/retry, workspace URL/filter/page/status/detail behavior, companies/contacts, notes, interviews, and independent related-resource error paths remain intact in the reviewed flows.                                                                                                                                    |
| PostgreSQL query integration               | **Blocked**                                    | The two Phase 4 Testcontainers tests could not start because no valid Docker environment is available. Inclusive date/completion/association predicates therefore remain unexecuted against PostgreSQL here.                                                                                                                                                                                     |
| Browser/accessibility/responsive runtime   | **Not tested**                                 | No frontend test runner or browser tool is configured. Focus, scrolling to URL fragments, Back behavior, announcements, mobile layout, and midnight behavior were inspected statically where possible but not executed.                                                                                                                                                                          |

### Defect resolution

#### CF-P4-01 — Attention summary is not invalidated after detail mutations — RESOLVED

- **Original severity:** MEDIUM
- **Affected feature:** Applications attention summary; completed follow-ups and completed/cancelled
  interviews.
- **Responsible owner:** `frontend-workspace` / orchestrator integration.
- **Resolution evidence:** `ApplicationsPage` owns `attentionRevision` and passes a successful-
  mutation callback through `ApplicationDetailsPanel`/`ApplicationDetailsContent` to both related
  resource sections. Follow-up add, edit, and completion invoke it only when the mutation promise
  returns a saved resource. Interview add and edit/status transitions do the same. The revision is
  passed through `ApplicationsAttention` into both memoized attention loaders, causing both
  independent resources to reload with stale-request cancellation intact.
- **Failure-path verification:** Follow-up and interview mutation hooks return `null` after API
  failure or duplicate-pending suppression. Every callback is guarded by `if (saved)`, so failed,
  invalid, missing-record, or blocked duplicate mutations do not increment the revision. Drafts
  and mutation errors therefore remain available without an unrelated attention refresh.
- **Result:** **Resolved by static state-flow inspection.** Successful follow-up add/edit/complete
  and interview add/edit/status changes invalidate attention; failed mutations do not.

No remaining Phase 4 functional defect was identified in this re-review.

### Commands and actual results

- Backend: `./mvnw -Dtest='*,!DemoApplicationTests,!JobApplicationRepositoryPersistenceTest,!JobApplicationPhaseTwoQueryIntegrationTest,!PhaseThreeRelatedResourcesQueryIntegrationTest,!PhaseFourFollowUpQueryIntegrationTest' test` — **PASS**, 152 tests, 0 failures/errors/skips.
- Backend implementation was unchanged for this correction; the orchestrator additionally reported
  a current **149-test pass**, so backend execution was not repeated for this frontend-only fix.
- Backend PostgreSQL check: `./mvnw -q -Dtest=PhaseFourFollowUpQueryIntegrationTest test` — **BLOCKED/ERROR**, 2 tests could not load context because Testcontainers found no valid Docker environment.
- Frontend: `npm run lint` — **PASS**.
- Frontend: `npm run format:check` — **PASS**.
- Frontend: `npm run build` — **PASS**, TypeScript and Vite build, 115 modules transformed.
- Repository: `git diff --check` — **PASS**.

### Release recommendation

**PASS** — CF-P4-01 is resolved in the integrated success/failure state flow, all Phase 4 acceptance
paths reviewed statically are correctly wired, frontend quality gates pass, and applicable backend
regression suites pass. PostgreSQL/Testcontainers and actual browser/accessibility execution remain
explicit environment limitations rather than passed claims.

## Phase 4 automation preparation — 2026-10-27

### Scope and status

- Added automated contract coverage for the agreed follow-up response
  `{ id, applicationId, title, dueDate, completed }`, persisted POST response, full PUT,
  completion, reassociation, validation, missing references, and query filters.
- Added deterministic PostgreSQL integration coverage for application association,
  `completed`, and inclusive `dueDateFrom`/`dueDateTo` boundaries.
- Added a deterministic manual checklist for follow-ups, attention, seven-status Progress
  counts, date boundaries, navigation context, accessibility, and responsive behavior.
- This is **test preparation, not an independent Phase 4 signoff**. Production agents are still
  integrating Phase 4, so frontend behavior and complete regression results are not yet claimed.

### Automated results

| Area                                        | Result         | Evidence                                                                                                                                                                                              |
| ------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Follow-up controller/service/mapper/request | **Passed**     | `./mvnw -Dtest='FollowUpControllerTest,FollowUpServiceTest,FollowUpMapperTest,FollowUpRequestTest' test`: 18 tests, 0 failures, 0 errors.                                                             |
| Follow-up query persistence                 | **Blocked**    | `./mvnw -Dtest=PhaseFourFollowUpQueryIntegrationTest test`: both tests could not start because Testcontainers found no valid Docker environment. This is an environment block, not a product failure. |
| Frontend component/E2E automation           | **Not tested** | `frontend/package.json` has no test script or test runner dependency. No dependency or shared configuration was added.                                                                                |
| Attention/Progress/browser navigation       | **Not tested** | Integrated Phase 4 UI was still in progress and no browser runner is configured. Cases are recorded in `backend/src/test/resources/qa/phase-4-manual-checklist.md`.                                   |

### Coverage added

- Controller: exact GET response ID and association, date/completion filter forwarding, POST
  `201` persisted body, PUT full updated body/completion, validation envelope, and unknown
  application envelope.
- Service: persisted create mapping, generated ID propagation, full update/reassociation,
  completion, unknown follow-up, and unknown application behavior.
- Mapper: follow-up ID propagation in addition to all existing fields.
- PostgreSQL integration (prepared, blocked locally): exact application association, pending and
  completed filtering, and inclusive fixed boundaries `2026-10-27` through `2026-10-31`.

### Defects and risks

- No defect is filed from the passing unit/controller contract tests.
- Database predicate behavior remains unexecuted until Docker/PostgreSQL is available.
- Frontend follow-up mutation, actionable-list removal, attention isolation, Progress accuracy,
  metric navigation, browser Back, keyboard behavior, and responsive rendering remain unverified.
- Final release recommendation is intentionally deferred until integrated-code verification.

## Phase 3 post-fix report

## Re-review scope

- Re-reviewed the integrated Phase 3 frontend after fixes for CF-P3-01 through CF-P3-04.
- Verification used frontend/backend contract tracing, static state/request-flow inspection, frontend quality gates, and prior backend automation evidence.
- Browser tooling and Docker remain unavailable. No browser, accessibility-runtime, responsive-rendering, or PostgreSQL runtime claims are made.

## Fix verification

| Defect                                   | Result                            | Exact evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CF-P3-01 — Interview directory omissions | **Resolved by static inspection** | `InterviewsWorkspace.isUpcoming` defines the exact partition as `SCHEDULED` with non-null `interviewDate >= today`. Upcoming requests exactly that server filter in ASC order. “Past and other interviews” requests every interview in DESC order and removes only that exact upcoming predicate. Thus every interview is in exactly one section. Filtering is performed independently on each raw server page; sparse/empty rendered pages are possible, but raw page metadata is retained and Previous/Next remains rendered when `totalPages > 1`, so all server pages remain reachable. |
| CF-P3-02 — Contacts URL company context  | **Resolved by static inspection** | `ContactsPage` passes `searchParams.get('companyId')` directly to `useContactsData`, so the first contacts request is immediately scoped without waiting for company display data. `useContactCompanySelection` exposes loading/error/retry. Clear deletes `companyId`; combobox selection writes it; typing clears it. Add is disabled until URL company context resolves and receives the resolved company for safe prefilling.                                                                                                                                                           |
| CF-P3-03 — Independent company sections  | **Resolved by static inspection** | Company, application, and contact hooks continue to load/retry independently. Applications render with fallback company label `Company`. Contacts no longer return `null` without the primary company DTO; they render successful/empty data with a safe fallback label and retain the company-ID directory link. Add actions remain appropriately unavailable until the company DTO exists.                                                                                                                                                                                                |
| CF-P3-04 — Paginated create corruption   | **Resolved by static inspection** | Local prepend/update helpers were removed from company directory, contacts directory, and company-detail applications/contacts. After a successful POST, each flow closes its modal, sets page 0, and increments a revision to fetch authoritative server data. Refresh is triggered synchronously but not awaited as part of the POST transaction, so a refresh failure cannot repeat the POST or make the successful submit appear failed. Server ordering, page size, and metadata are no longer locally synthesized.                                                                    |

## Regression inspection

- Company directory still sends debounced server `companyName`, page, size, and `companyName,ASC`, with request sequencing, empty/error states, retry, and pagination.
- Company edit still sends the complete PUT and synchronizes the returned DTO.
- Company-prefilled application creation retains the fixed company ID, optional job type mapping, and duplicate-submit guard.
- Contact create/edit still sends the full company/name/role/email/phone representation and parses persisted `companyID` responses.
- Application Company Contacts still uses company association only; notes and interviews retain application filters and isolated error states.
- Notes retain create/edit drafts on failure, pending guards, returned-resource synchronization, missing-record handling, and separate `/api/notes` persistence.
- Application interviews retain full PUT fields, date-only values, all statuses, association, and duplicate prevention.
- No new static regression was found in the reviewed Phase 1/2 creation, status/edit/delete/filter/pagination/detail context paths.

## Checks

- `frontend: npm run lint` — **PASS**.
- `frontend: npm run format:check` — **PASS**.
- `frontend: npm run build` — **PASS**, 108 modules transformed.
- `git diff --check` — **PASS**.
- Backend was not rerun because relevant backend production/tests are unchanged from the preceding integrated verification: broad non-Docker **146 passed** and targeted Phase 1/2/3 **88 passed**.

## Remaining defects and limitations

- No remaining CF-P3-01 through CF-P3-04 defect or new release-blocking static defect was identified.
- Actual browser navigation, sparse interview-page interaction, focus behavior, keyboard interaction, accessibility announcements, responsive layout, and network timing remain unverified.
- PostgreSQL/Testcontainers tests remain blocked by unavailable Docker.
- The frontend has no configured component/E2E test runner; frontend behavior was verified by static flow inspection plus lint/typecheck/build.

## QA files

- Updated `docs/careerflow-implementation/qa-report.md` for the post-fix signoff.
- Existing Phase 3 tests and manual checklist remain unchanged.

## Release recommendation

**PASS** — CF-P3-01 through CF-P3-04 are resolved in the integrated data/state flows, all requested frontend checks pass, prior backend automation remains applicable, and no new release-blocking defect was found. Browser and Docker-backed verification remain explicit limitations.
