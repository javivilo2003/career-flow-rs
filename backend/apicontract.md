# CareerFlow API Contract

This document records the HTTP contract shared by the CareerFlow backend and frontend. It reflects the current Spring controllers, DTOs, filters, enum definitions, service sort allowlists, and global error handler.

When this document disagrees with the implemented backend, the backend code describes current runtime behavior. Reconcile the difference and update this document in the same change as any public API modification.

## Shared conventions

- Base path: `/api`
- Request and response media type: `application/json`
- UUIDs are JSON strings.
- `LocalDate` values use `YYYY-MM-DD`.
- Enum values use the exact uppercase strings documented below.
- Collection endpoints other than users return a Spring `Page<T>` object.
- Pagination: `page` defaults to `0` and must be at least `0`; `size` defaults to `10` and must be between `1` and `100`.
- `direction` accepts `ASC` or `DESC`.
- Unsupported sort fields return `400 INVALID_REQUEST`.
- Paginated application sorting uses `id` in the requested direction as a stable secondary sort unless `id` is already the primary sort.
- Create endpoints documented with an empty response must not be parsed as JSON.

### Page response

```json
{
  "content": [],
  "number": 0,
  "size": 10,
  "totalElements": 0,
  "totalPages": 0,
  "first": true,
  "last": true,
  "numberOfElements": 0,
  "empty": true
}
```

### Error response

All handled errors use this envelope. `details` is omitted when it is `null`.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [{ "field": "position", "message": "Position is required" }]
  }
}
```

Error codes and usual statuses:

| Status | Code |
| --- | --- |
| 400 | `INVALID_REQUEST`, `VALIDATION_ERROR` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 500 | `INTERNAL_ERROR` |

## Enums

`ApplicationStatus`: `SAVED`, `PREPARING`, `APPLIED`, `INTERVIEWING`, `OFFER`, `REJECTED`, `WITHDRAWN`

`InterviewStatus`: `SCHEDULED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`, `PASSED`, `FAILED`, `WAITING_FEEDBACK`

## Endpoint summary

Every resource supports `GET /resource/{id}`, `PUT /resource/{id}`, and `DELETE /resource/{id}` in addition to the collection operations below. Single-item GET and PUT return the resource DTO with `200`. DELETE returns `204` with no body. Missing referenced resources return `404`.

| Resource | Collection path | GET default sort | POST success |
| --- | --- | --- | --- |
| Users | `/api/users` | Not paginated | `200`, empty body |
| Companies | `/api/companies` | `createdAt,DESC` | `201`, `CompanyDTO` |
| Applications | `/api/applications` | `createdAt,DESC` | `201`, `JobApplicationDTO` |
| Contacts | `/api/contacts` | `name,ASC` | `200`, `ContactDTO` |
| Interviews | `/api/interviews` | `interviewDate,ASC` | `200`, `InterviewDTO` |
| Notes | `/api/notes` | `createdAt,DESC` | `201`, `NoteDTO` |
| Follow-ups | `/api/followups` | `dueDate,ASC` | `201`, `FollowUpDTO` |

## Users

`GET /api/users` returns an unpaginated array.

Response fields: `id`, `username`, `dob`, `cv`, `createdAt`. `dob` uses `YYYY-MM-DD`; `createdAt` is a timestamp. `dob` and `cv` may be `null`.

POST/PUT request:

```json
{ "username": "alex", "dob": "2000-01-15", "cv": "/path/to/cv.pdf" }
```

`username` is required and non-null. `dob` and `cv` are nullable.

## Companies

Response fields: `id`, `companyName`, `companyAddress`, `bio`, `websiteUrl`.

POST/PUT request:

```json
{
  "companyName": "Acme",
  "companyAddress": "Madrid, Spain",
  "bio": "Software company",
  "websiteUrl": "https://example.com"
}
```

`companyName` is required and nonblank. Other fields are nullable; a non-null `websiteUrl` must be a valid URL.

`POST /api/companies` returns the persisted company directly, including its generated `id`:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "companyName": "Acme",
  "companyAddress": "Madrid, Spain",
  "bio": "Software company",
  "websiteUrl": "https://example.com"
}
```

Company names are unique case-insensitively, and non-null website URLs remain unique. A known name or website uniqueness conflict returns `409 CONFLICT` in the shared error envelope.

Company PUT is a full update. `companyName` is required, and the supplied `companyAddress`, `bio`, and `websiteUrl` replace the stored values; omitting or sending `null` for a nullable field clears it. It returns the updated `CompanyDTO` with `200`.

Filters: `id`, `companyName`, `address`, `bio`, `website`, `createdAt`.

`companyName` performs a case-insensitive partial match. The other text filters retain exact matching behavior.

Sort fields: `id`, `companyName`, `companyAddress`, `bio`, `websiteUrl`, `createdAt`.

`DELETE /api/companies/{id}` returns `204` with no body when deletion succeeds. It returns `409 CONFLICT` when an application or contact still references the company. An unknown company returns `404 NOT_FOUND`.

## Applications

Response fields: `id`, `userId`, `companyId`, `position`, `jobType`, `description`, `salary`, `status`, `appliedAt`, `source`, `postingLink`.

POST request:

```json
{
  "companyId": "00000000-0000-0000-0000-000000000000",
  "position": "Frontend Engineer",
  "jobType": null,
  "description": null,
  "salary": null,
  "status": "SAVED",
  "appliedAt": null,
  "source": "Manual entry",
  "postingLink": null
}
```

Required and non-null: `companyId`, `position`, `status`, `source`. The DTO uses `@NotNull` for these fields, so blank strings are not rejected at the DTO boundary. `userId`, `jobType`, `description`, `salary`, `appliedAt`, and `postingLink` are nullable.

For POST, omitting `userId` or sending it as `null` assigns the deterministic dedicated owner used by the single-user deployment. A supplied `userId` is preserved for compatibility and must reference an existing user; an unknown explicit owner returns `404 NOT_FOUND`. The persisted response always contains the resolved `userId`.

`POST /api/applications` returns the persisted application directly, including its generated `id`:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "userId": "8bf7e93a-53a5-4a35-9ec8-2cf8f21a9c01",
  "companyId": "00000000-0000-0000-0000-000000000000",
  "position": "Frontend Engineer",
  "jobType": null,
  "description": null,
  "salary": null,
  "status": "SAVED",
  "appliedAt": null,
  "source": "Manual entry",
  "postingLink": null
}
```

PUT remains a full resource update for application fields. Clients editing an application should send the complete representation:

```json
{
  "userId": "8bf7e93a-53a5-4a35-9ec8-2cf8f21a9c01",
  "companyId": "00000000-0000-0000-0000-000000000000",
  "position": "Frontend Engineer",
  "jobType": null,
  "description": null,
  "salary": null,
  "status": "APPLIED",
  "appliedAt": "2026-10-27",
  "source": "Manual entry",
  "postingLink": null
}
```

`companyId`, `position`, `status`, and `source` remain required. All application fields other than ownership are replaced by the supplied values, so omitting a nullable field clears it. If PUT omits `userId` or sends it as `null`, the application's stored owner is preserved. Supplying a different valid `userId` explicitly changes the owner; an unknown owner returns `404 NOT_FOUND`. `jobType` may be `null` in both requests and responses.

Filters: `id`, `userId`, `companyId`, `position`, `jobType`, `minSalary`, `maxSalary`, `status`, `appliedAt`, `createdAt`, `source`.

`position` performs a case-insensitive partial match after trimming surrounding whitespace. `%`, `_`, and `\\` are treated as literal search characters rather than SQL wildcard syntax. Blank position filters are ignored.

`companyId` performs an exact match on the associated company's ID, so `GET /api/applications?companyId={uuid}` returns only applications for that company.

Sort fields: `id`, `createdAt`, `appliedAt`, `position`, `salary`, `status`, `companyName`.

`DELETE /api/applications/{id}` returns `204` with no body when deletion succeeds. It returns `409 CONFLICT` in the shared error envelope when an interview, note, or follow-up still references the application. An unknown application returns `404 NOT_FOUND`.

## Contacts

Response fields: `id`, `companyID`, `name`, `phone`, `email`, `jobRole`.

The response property is exactly `companyID` with a capital `ID`. Frontend code must preserve that wire name or explicitly adapt it to a domain model.

POST/PUT request:

```json
{
  "companyId": "00000000-0000-0000-0000-000000000000",
  "name": "Ada",
  "phone": null,
  "email": null,
  "jobRole": "Engineering Manager"
}
```

Required and non-null: `companyId`, `name`, `jobRole`. `phone` and `email` are nullable.

`POST /api/contacts` keeps its `200 OK` status and returns the persisted contact directly, including its generated `id`:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "companyID": "00000000-0000-0000-0000-000000000000",
  "name": "Ada",
  "phone": null,
  "email": null,
  "jobRole": "Engineering Manager"
}
```

Contact PUT is a full update. All supplied fields replace their stored values, including reassignment to the required `companyId`; omitting nullable `phone` or `email` clears it. It returns the updated `ContactDTO` with `200`.

`jobRole` is not unique. Multiple contacts, whether in the same or different companies, may have the same role. Non-null contact email addresses remain unique at the database level; a uniqueness conflict returns `409 CONFLICT` in the shared error envelope.

Filters: `id`, `companyId`, `name`, `email`, `jobRole`.

`companyId` is an exact association-ID match. `name` and `jobRole` are case-insensitive partial matches after surrounding whitespace is trimmed; `email` is a case-insensitive exact match. Blank text filters are ignored.

Sort fields: `id`, `companyName`, `name`, `email`, `jobRole`. `createdAt` is not supported.

`DELETE /api/contacts/{id}` returns `204` with no body. An unknown contact returns `404 NOT_FOUND`. Contacts have no application association and deletion does not delete their company.

## Interviews

Response fields: `id`, `jobApplicationId`, `stage`, `status`, `interviewDate`, `notes`.

POST/PUT request:

```json
{
  "jobApplicationId": "00000000-0000-0000-0000-000000000000",
  "stage": "Technical",
  "status": "SCHEDULED",
  "interviewDate": "2026-10-30",
  "notes": null
}
```

Required and non-null: `jobApplicationId`, `stage`, `status`. `interviewDate` and `notes` are nullable.

`POST /api/interviews` keeps its `200 OK` status and returns the persisted interview directly, including its generated `id`:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "jobApplicationId": "00000000-0000-0000-0000-000000000000",
  "stage": "Technical",
  "status": "SCHEDULED",
  "interviewDate": "2026-10-30",
  "notes": null
}
```

Interview PUT is a full update. All supplied fields replace their stored values, including reassignment to the required `jobApplicationId`; omitting nullable `interviewDate` or `notes` clears it. It returns the updated `InterviewDTO` with `200`.

Filters: `id`, `jobApplicationId`, `stage`, `status`, `interviewDateFrom`, `interviewDateTo`.

`jobApplicationId` is an exact association-ID match. `stage` is a case-insensitive partial match after surrounding whitespace is trimmed. Date bounds are inclusive. Blank stage filters are ignored.

Sort fields: `id`, `stage`, `status`, `interviewDate`.

`DELETE /api/interviews/{id}` returns `204` with no body. An unknown interview returns `404 NOT_FOUND`; deleting an interview does not delete its application.

## Notes

Response fields: `id`, `jobApplicationId`, `content`.

POST/PUT request:

```json
{
  "jobApplicationId": "00000000-0000-0000-0000-000000000000",
  "content": "Follow up next week."
}
```

`jobApplicationId` is required and non-null. `content` is required and nonblank.

`POST /api/notes` keeps its `201 Created` status and returns the persisted note directly, including its generated `id`:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "jobApplicationId": "00000000-0000-0000-0000-000000000000",
  "content": "Follow up next week."
}
```

Note PUT is a full update. Both fields are required and replace their stored values, including reassignment to `jobApplicationId`. It returns the updated `NoteDTO` with `200`.

Filters: `id`, `jobApplicationId`, `content`, `createdAt`.

`jobApplicationId` is an exact association-ID match. `content` is a case-insensitive partial match after surrounding whitespace is trimmed. `createdAt` matches notes created on that calendar date. Blank content filters are ignored.

Sort fields: `id`, `content`, `createdAt`.

`DELETE /api/notes/{id}` returns `204` with no body. An unknown note returns `404 NOT_FOUND`; deleting a note does not delete its application.

## Follow-ups

Response fields are exactly `id`, `applicationId`, `title`, `dueDate`, `completed`. Both IDs are UUID strings. The application reference remains exactly `applicationId`, not `jobApplicationId`.

POST/PUT request:

```json
{
  "applicationId": "00000000-0000-0000-0000-000000000000",
  "title": "Send thank-you email",
  "dueDate": "2026-10-31",
  "completed": false
}
```

All request fields are required and non-null.

`POST /api/followups` returns `201 Created` with the persisted follow-up directly, including its generated `id`:

```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "applicationId": "00000000-0000-0000-0000-000000000000",
  "title": "Send thank-you email",
  "dueDate": "2026-10-31",
  "completed": false
}
```

Single-item GET and PUT return the same `FollowUpDTO` shape with `200 OK`. PUT is a full update: clients must send all four request fields, including when marking a follow-up complete. Every supplied field replaces its stored value, including reassignment to the required `applicationId`.

Completion update example:

```json
{
  "applicationId": "00000000-0000-0000-0000-000000000000",
  "title": "Send thank-you email",
  "dueDate": "2026-10-31",
  "completed": true
}
```

Filters: `id`, `applicationId`, `title`, `completed`, `dueDateFrom`, `dueDateTo`.

`id` and `applicationId` are exact UUID matches. `title` is a case-insensitive partial match after surrounding whitespace is trimmed; a blank title filter is ignored. `completed` is an exact boolean match. `dueDateFrom` and `dueDateTo` are inclusive date bounds.

Sort fields: `id`, `title`, `dueDate`, `completed`.

An unknown follow-up ID or an unknown referenced `applicationId` returns `404 NOT_FOUND` in the shared error envelope. Invalid requests retain the shared `400` error behavior. `DELETE /api/followups/{id}` returns `204` with no body and does not delete its application.

## Frontend transport

The Vite development server proxies `/api` to `VITE_API_URL`. Frontend API modules should use relative `/api/...` paths so development and deployed environments share the same calls.

Frontend wire types belong in `frontend/src/types/api.ts`; request types may remain beside their API functions. Components and pages must not call `fetch` directly.
