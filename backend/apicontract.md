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
- Create endpoints with an empty response must not be parsed as JSON.

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
| Companies | `/api/companies` | `createdAt,DESC` | `200`, empty body |
| Applications | `/api/applications` | `createdAt,DESC` | `201`, empty body |
| Contacts | `/api/contacts` | `name,ASC` | `200`, empty body |
| Interviews | `/api/interviews` | `interviewDate,ASC` | `200`, empty body |
| Notes | `/api/notes` | `createdAt,DESC` | `201`, empty body |
| Follow-ups | `/api/followups` | `dueDate,ASC` | `201`, empty body |

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

Filters: `id`, `companyName`, `address`, `bio`, `website`, `createdAt`.

Sort fields: `id`, `companyName`, `companyAddress`, `bio`, `websiteUrl`, `createdAt`.

## Applications

Response fields: `id`, `userId`, `companyId`, `position`, `jobType`, `description`, `salary`, `status`, `appliedAt`, `source`, `postingLink`.

POST/PUT request:

```json
{
  "userId": "00000000-0000-0000-0000-000000000000",
  "companyId": "00000000-0000-0000-0000-000000000000",
  "position": "Frontend Engineer",
  "jobType": "Full-time",
  "description": null,
  "salary": null,
  "status": "SAVED",
  "appliedAt": null,
  "source": "Manual entry",
  "postingLink": null
}
```

Required and non-null: `userId`, `companyId`, `position`, `jobType`, `status`, `source`. The current DTO uses `@NotNull`, so blank strings are not rejected at the DTO boundary. `description`, `salary`, `appliedAt`, and `postingLink` are nullable.

Filters: `id`, `userId`, `companyId`, `position`, `jobType`, `minSalary`, `maxSalary`, `status`, `appliedAt`, `createdAt`, `source`.

Sort fields: `id`, `createdAt`, `appliedAt`, `position`, `salary`, `status`, `companyName`.

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

Filters: `id`, `companyId`, `name`, `email`, `jobRole`.

Sort fields: `id`, `companyName`, `name`, `email`, `jobRole`. `createdAt` is not supported.

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

Filters: `id`, `jobApplicationId`, `stage`, `status`, `interviewDateFrom`, `interviewDateTo`.

Sort fields: `id`, `stage`, `status`, `interviewDate`.

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

Filters: `id`, `jobApplicationId`, `content`, `createdAt`.

Sort fields: `id`, `content`, `createdAt`.

## Follow-ups

Response fields: `applicationId`, `title`, `dueDate`, `completed`.

The current response does not include a follow-up `id`. The application reference is exactly `applicationId`, not `jobApplicationId`.

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

Filters: `id`, `applicationId`, `title`, `completed`, `dueDateFrom`, `dueDateTo`.

Sort fields: `id`, `title`, `dueDate`, `completed`.

## Frontend transport

The Vite development server proxies `/api` to `VITE_API_URL`. Frontend API modules should use relative `/api/...` paths so development and deployed environments share the same calls.

Frontend wire types belong in `frontend/src/types/api.ts`; request types may remain beside their API functions. Components and pages must not call `fetch` directly.

## Known compatibility warnings

These are current repository mismatches to resolve before relying on the affected flows:

- `frontend/src/api/contacts.ts` defaults to `sort=createdAt`, but the contacts backend does not allow that sort field.
- The frontend `Contact` type uses `companyId`, while the backend response sends `companyID`.
- The frontend `FollowUp` type expects `id` and `jobApplicationId`, while the backend response sends no `id` and uses `applicationId`.
