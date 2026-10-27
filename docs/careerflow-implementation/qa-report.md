# CareerFlow QA report

## Scope

- Phase: focused final signoff for integrated Phase 2 and Phase 1 creation regressions.
- Method: frontend/backend contract trace, static interaction/state review, frontend quality gates, and prior non-Docker backend test evidence.
- Browser and Docker-backed runtime verification were unavailable; no browser/E2E claims are made.

## Final fix verification

| Area | Result | Evidence |
| --- | --- | --- |
| Workspace picker selected versus active state | Passed by static inspection | `CompanyResults` sets `aria-selected` from committed `companyId`; the combobox sets `aria-activedescendant` independently from `activeIndex`. Keyboard navigation therefore does not falsely commit selection. |
| Existing company propagation from creation form | Passed by static inspection | `AddApplicationModal` exposes `onCompanySelected`; `ApplicationCompanyField` invokes it after an existing search result is selected. Inline-created companies continue through `onCompanyCreated`. |
| Creation fallback company identity | Passed by static inspection | `ApplicationsPage` passes `data.synchronizeCompany` to both selection callbacks, updating `companies` and `companyNames` before application submission. A destination-scoped fallback can therefore render the selected company name if refresh fails. |

## Prior-defect regression check

- Destination-scoped `creationFallback` remains keyed to the cleared destination status/filter/page and is rendered while destination data is not current.
- Non-current ordinary filter/page results still render `ApplicationsSkeleton` rather than stale rows.
- Workspace company picker retains Arrow Up/Down, Home/End, Enter, Escape, outside dismissal, committed selection, and active-descendant behavior.
- Detail panel retains initial focus, Tab/Shift+Tab containment, nested-dialog handling, Escape close, and focus restoration.
- Direct-detail edit still passes the details request's fetched `Company` into the edit modal.
- Phase 1 initial Arrow Down still moves from no active option to index `0`.
- No static regression found in URL normalization/history, server page size 25, complete status counts, debounced/request-sequenced search, full PUT status/edit behavior, delete/conflict behavior, pagination, empty/error/loading states, or Phase 1 creation retry/preservation behavior.

## Defects and release blockers

- No remaining release blocker was identified in this focused review.

## Commands

- `frontend: npm run lint` — PASS.
- `frontend: npm run format:check` — PASS.
- `frontend: npm run build` — PASS.
- `git diff --check` — PASS.
- Backend suite not repeated: no backend production or test changes occurred after the immediately preceding non-Docker run, which passed all 140 selected tests.

## QA files changed

- Updated `docs/careerflow-implementation/qa-report.md` for final signoff.
- Earlier QA-owned Note and Follow-up controller expectation corrections remain unchanged.

## Limitations

- No browser runtime was available. Back/Forward, real focus behavior, keyboard/screen-reader announcements, responsive layouts, network timing, and complete E2E workflows remain statically verified only.
- Docker-backed query/persistence/application-context tests were not run.
- The frontend has no configured automated test runner; no dependency or package/configuration change was introduced.

## Release recommendation

**PASS** — both remaining defects are resolved by the integrated data flow and accessibility semantics, required frontend checks pass, prior resolved areas show no static regression, and the latest applicable backend evidence remains a 140-test non-Docker pass.
