# CareerFlow QA report

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

| Area | Result | Evidence |
| --- | --- | --- |
| Follow-up backend identity and mutations | **Passed** | The DTO/controller/service/mapper expose and return the persisted `id`; POST returns `201` with the persisted resource; PUT is a full update preserving the response identity and supporting reassociation/completion. Targeted coverage is included in the 152-test non-Docker pass. |
| Follow-up frontend contract | **Passed by static inspection** | `FollowUpResponse` exactly matches `{ id, applicationId, title, dueDate, completed }`; `followUpFromResponse` explicitly maps `applicationId` to `jobApplicationId`; list, GET, POST, and PUT all use the adapter and shared error envelope. |
| Application follow-up workflow | **Passed by static inspection** | Create/edit retain drafts on failure, one mutation is allowed at a time, successful responses update by persisted ID, full PUT fields are sent, completion moves an item between local outstanding/completed groups, due-date comparisons use local `YYYY-MM-DD`, and missing records are removed locally. |
| Attention contents and isolation | **Passed by static inspection** | Pending follow-ups are requested through inclusive `dueDateTo=today`; scheduled/rescheduled interviews use inclusive `interviewDateFrom=today`; resources load and retry independently and their failures do not block the Applications list. Successful follow-up/interview mutations now invalidate both attention resources; failed or blocked mutations return `null` and do not invalidate. |
| Progress | **Passed by static inspection** | Total and all seven application-status counts use authoritative `totalElements`; interviewing/offer metrics derive from those counts; every status metric links to `/applications?status=...`; interview summaries cover all seven interview statuses; no historical placeholder analytics remain. |
| Interview refinements | **Passed by static inspection** | Upcoming is exactly scheduled/rescheduled with non-null date from local today; history contains the complement including undated/finished records; merged pagination fetches sufficient per-status prefixes; date-only formatting avoids UTC conversion. |
| Applications/header/navigation integration | **Passed by static inspection** | Applications remains the index route and first navigation item; Dashboard is presented as Progress; attention detail links retain current list query and origin state and target the relevant detail section. |
| Phase 1–3 regression | **Passed by automation and static inspection** | The broad non-Docker suite passed 152 tests. Existing creation preservation/retry, workspace URL/filter/page/status/detail behavior, companies/contacts, notes, interviews, and independent related-resource error paths remain intact in the reviewed flows. |
| PostgreSQL query integration | **Blocked** | The two Phase 4 Testcontainers tests could not start because no valid Docker environment is available. Inclusive date/completion/association predicates therefore remain unexecuted against PostgreSQL here. |
| Browser/accessibility/responsive runtime | **Not tested** | No frontend test runner or browser tool is configured. Focus, scrolling to URL fragments, Back behavior, announcements, mobile layout, and midnight behavior were inspected statically where possible but not executed. |

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

| Area | Result | Evidence |
| --- | --- | --- |
| Follow-up controller/service/mapper/request | **Passed** | `./mvnw -Dtest='FollowUpControllerTest,FollowUpServiceTest,FollowUpMapperTest,FollowUpRequestTest' test`: 18 tests, 0 failures, 0 errors. |
| Follow-up query persistence | **Blocked** | `./mvnw -Dtest=PhaseFourFollowUpQueryIntegrationTest test`: both tests could not start because Testcontainers found no valid Docker environment. This is an environment block, not a product failure. |
| Frontend component/E2E automation | **Not tested** | `frontend/package.json` has no test script or test runner dependency. No dependency or shared configuration was added. |
| Attention/Progress/browser navigation | **Not tested** | Integrated Phase 4 UI was still in progress and no browser runner is configured. Cases are recorded in `backend/src/test/resources/qa/phase-4-manual-checklist.md`. |

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

| Defect | Result | Exact evidence |
| --- | --- | --- |
| CF-P3-01 — Interview directory omissions | **Resolved by static inspection** | `InterviewsWorkspace.isUpcoming` defines the exact partition as `SCHEDULED` with non-null `interviewDate >= today`. Upcoming requests exactly that server filter in ASC order. “Past and other interviews” requests every interview in DESC order and removes only that exact upcoming predicate. Thus every interview is in exactly one section. Filtering is performed independently on each raw server page; sparse/empty rendered pages are possible, but raw page metadata is retained and Previous/Next remains rendered when `totalPages > 1`, so all server pages remain reachable. |
| CF-P3-02 — Contacts URL company context | **Resolved by static inspection** | `ContactsPage` passes `searchParams.get('companyId')` directly to `useContactsData`, so the first contacts request is immediately scoped without waiting for company display data. `useContactCompanySelection` exposes loading/error/retry. Clear deletes `companyId`; combobox selection writes it; typing clears it. Add is disabled until URL company context resolves and receives the resolved company for safe prefilling. |
| CF-P3-03 — Independent company sections | **Resolved by static inspection** | Company, application, and contact hooks continue to load/retry independently. Applications render with fallback company label `Company`. Contacts no longer return `null` without the primary company DTO; they render successful/empty data with a safe fallback label and retain the company-ID directory link. Add actions remain appropriately unavailable until the company DTO exists. |
| CF-P3-04 — Paginated create corruption | **Resolved by static inspection** | Local prepend/update helpers were removed from company directory, contacts directory, and company-detail applications/contacts. After a successful POST, each flow closes its modal, sets page 0, and increments a revision to fetch authoritative server data. Refresh is triggered synchronously but not awaited as part of the POST transaction, so a refresh failure cannot repeat the POST or make the successful submit appear failed. Server ordering, page size, and metadata are no longer locally synthesized. |

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
