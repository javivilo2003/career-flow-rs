# CareerFlow Phase 2 static and manual QA checklist

Record each item as **Passed**, **Failed**, **Blocked**, or **Not tested**. Capture the URL,
request/response evidence, viewport, browser, and relevant application IDs for failures.

## Applications landing, URL state, and history

- [ ] `/` and the primary Applications navigation land on the Applications workspace.
- [ ] Search, company, status, sort, direction, and page are represented by stable URL parameters.
- [ ] Reloading a filtered/paged URL restores the same controls and results without a flash of stale data.
- [ ] Opening an application details route and using browser Back restores filters, page, sort, and scroll context.
- [ ] Browser Forward returns to the same application detail route.
- [ ] A direct application detail URL loads without first visiting the list.
- [ ] A missing/malformed application ID has a usable error/not-found state and recovery navigation.
- [ ] Navigating from application details to company details and back preserves relevant list context.
- [ ] Unknown URL query values are rejected or normalized consistently without a render loop.

## Server filtering, sorting, pagination, and counts

- [ ] Position search is server-side, partial, trimmed, and case-insensitive.
- [ ] `%`, `_`, and `\\` in position text are treated as literal user text, not SQL wildcards.
- [ ] Company and all seven status filters combine with position search.
- [ ] Filter changes reset page to zero and do not briefly display the previous page as current data.
- [ ] Pagination sends zero-based `page` and bounded `size`; next/previous controls honor first/last metadata.
- [ ] A final partially filled page renders correctly; deletion of its last row moves to a valid prior page.
- [ ] Sorting uses only `id`, `createdAt`, `appliedAt`, `position`, `salary`, `status`, or `companyName`.
- [ ] ASC/DESC sorting is deterministic enough that paging neither duplicates nor skips rows.
- [ ] Unsupported sort and invalid page/size values show the shared API error safely.
- [ ] Status tab counts are defined and consistent (filtered counts versus global counts are not mixed).
- [ ] Counts and list rows refresh together after create, status update, edit, and delete.
- [ ] Rapid filter changes cannot let an older response overwrite the latest result.

## Status update and complete PUT behavior

- [ ] Changing status sends the complete current application representation required by PUT.
- [ ] Status PUT preserves company, owner, position, job type, description, salary, applied date, source, and link.
- [ ] Omitted/null `userId` preserves the stored owner; a valid explicit owner change is honored.
- [ ] Pending state disables repeat mutation and communicates progress without blocking unrelated rows.
- [ ] Successful PUT updates the row, status tab/counts, and detail view consistently.
- [ ] Failed PUT restores the original status and counts, surfaces an accessible error, and remains retryable.
- [ ] A stale/out-of-order status response cannot overwrite a newer successful status.

## Editing and deletion

- [ ] Edit opens with every nullable and required field represented accurately.
- [ ] Required-field, enum, date, URL, and numeric validation errors are associated with their controls.
- [ ] Saving edits persists all fields and reflects them after a full reload.
- [ ] Cancel/close discards edits and restores focus to the invoking control.
- [ ] Delete always requires explicit confirmation naming the correct application.
- [ ] Successful delete receives `204`, removes only that row, updates counts, and repairs pagination.
- [ ] `409 CONFLICT` for interviews/notes/follow-ups keeps the row and explains why deletion is blocked.
- [ ] `404`, network, and unexpected delete failures keep the row and allow retry without duplicate requests.

## Empty, loading, and error states

- [ ] Initial loading, page loading, empty dataset, no filter matches, and API failure are distinct states.
- [ ] Main list failure offers retry and does not present stale data as current.
- [ ] Attention-summary failure does not block the Applications workspace.
- [ ] Loading indicators are announced without repeatedly stealing focus.
- [ ] Error messages use the backend envelope and do not expose stack traces or raw response bodies.

## Accessibility and responsive behavior

- [ ] All filters, tabs, pagination, cards/rows, edit, status, and delete controls work keyboard-only.
- [ ] Focus is visible; logical focus order follows visual order; route changes place focus predictably.
- [ ] Combobox supports arrows, Enter, Escape, outside dismissal, selected state, and an accessible name.
- [ ] Dialog focus is contained, Escape closes when safe, and close restores trigger focus.
- [ ] Status/count state is not conveyed by color alone; control names include application context.
- [ ] Errors and pending/success feedback are exposed to assistive technology at appropriate urgency.
- [ ] At 320px width and short viewport heights, forms/actions remain reachable with no horizontal overflow.
- [ ] Long position/company names wrap without covering badges, menus, links, or action controls.
- [ ] Desktop list density, tablet layout, zoom to 200%, reduced motion, and high-contrast focus remain usable.

## Phase 1 creation regression

- [ ] Create with an existing company; created application appears under the active list rules.
- [ ] Create a company inline, auto-select it, then create the application without losing form data.
- [ ] Zero-company state still permits inline company creation.
- [ ] Company creation failure preserves application fields; retry does not duplicate the company.
- [ ] Application creation failure preserves the newly created company and retry reuses its ID.
- [ ] Duplicate company conflict uses the shared `409 CONFLICT` error and remains recoverable.
- [ ] Duplicate clicks/Enter presses produce one company and one application at most.
- [ ] Required fields, cancellation, company combobox keyboard use, and refresh-failure recovery regressions pass.
