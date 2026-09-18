# CareerFlow

CareerFlow is a job-search tracking application organized as a monorepo. The
Spring Boot API lives in `backend/`, leaving the repository ready for a separate
frontend application. The API stores users, companies, job applications,
contacts, interviews, notes, and follow-up tasks so an application pipeline can
be managed from one place.

## Features

- Track job applications with company, role, source, salary, status, and application date.
- Store company profiles and related contacts.
- Record interview stages, dates, statuses, and notes.
- Add application notes and follow-up tasks.
- Validate incoming requests and return structured API errors.
- Manage the PostgreSQL schema with Flyway migrations.
- Expose actuator health checks, including a custom database health indicator.

## Tech Stack

- Java 21
- Spring Boot 4.1.1
- Spring Web MVC
- Spring Data JPA
- PostgreSQL
- Flyway
- Maven Wrapper
- JUnit and Testcontainers

## Requirements

- JDK 21
- PostgreSQL running locally
- Docker, if you want to run the Testcontainers-backed tests

## Getting Started

Clone the repository and move into the backend directory:

```bash
git clone <repository-url>
cd CareerFlow/backend
```

Create a local PostgreSQL role and database. For example:

```sql
CREATE USER db WITH PASSWORD 'password';
CREATE DATABASE db OWNER dbOwner;
```

For example, run those statements as a PostgreSQL administrator with `psql`:

```bash
psql -U postgres
```

Create `.env` in the backend directory (`CareerFlow/backend/.env`) and add the
datasource settings below. The backend imports this file automatically through
`application.properties`, so no shell `export` or `source` commands are
required. Deployed environment variables take precedence over values from the
file.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DB_URL` | Yes | PostgreSQL JDBC URL. |
| `DB_USERNAME` | Yes | PostgreSQL username. |
| `DB_PASSWORD` | Yes | PostgreSQL password. |

For example:

```dotenv
DB_URL=jdbc:postgresql://localhost:5432/db
DB_USERNAME=db
DB_PASSWORD=password
```

The database name and credentials must match the PostgreSQL role and database
you created. Do not commit real credentials or reuse local credentials in a
deployed environment.

Start the API:

```bash
./mvnw spring-boot:run
```

The API runs on:

```text
http://localhost:8080
```

Flyway runs automatically on startup and applies migrations from this
repository-relative path:

```text
backend/src/main/resources/db/migration
```

## Useful Commands

Run the following commands from the `backend/` directory.

Run the test suite:

```bash
./mvnw test
```

Build the project:

```bash
./mvnw clean package
```

Run the packaged application:

```bash
java -jar target/rs-0.0.1-SNAPSHOT.jar
```

Check application health:

```bash
curl http://localhost:8080/actuator/health
```

## API Overview

Base URL:

```text
http://localhost:8080/api
```

| Resource | Method | Endpoint | Description |
| --- | --- | --- | --- |
| Users | `GET` | `/users` | List all users. |
| Users | `GET` | `/users/{id}` | Get one user by UUID. |
| Users | `POST` | `/users` | Create a user. |
| Companies | `GET` | `/companies` | List all companies. |
| Companies | `GET` | `/companies/{id}` | Get one company by UUID. |
| Companies | `POST` | `/companies` | Create a company. |
| Applications | `GET` | `/applications` | Filter, sort, and paginate job applications. |
| Applications | `GET` | `/applications/{id}` | Get one job application by UUID. |
| Applications | `POST` | `/applications` | Create a job application. |
| Contacts | `GET` | `/contacts` | List all contacts. |
| Contacts | `GET` | `/contacts/{id}` | Get one contact by UUID. |
| Contacts | `POST` | `/contacts` | Create a contact. |
| Interviews | `GET` | `/interviews` | List all interviews. |
| Interviews | `GET` | `/interviews/{id}` | Get one interview by UUID. |
| Interviews | `POST` | `/interviews` | Create an interview. |
| Notes | `GET` | `/notes` | List all notes. |
| Notes | `GET` | `/notes/{id}` | Get one note by UUID. |
| Notes | `POST` | `/notes` | Create a note. |
| Follow-ups | `GET` | `/followups` | List all follow-up tasks. |
| Follow-ups | `GET` | `/followups/{id}` | Get one follow-up task by UUID. |
| Follow-ups | `POST` | `/followups` | Create a follow-up task. |

All `POST` endpoints accept JSON request bodies. `POST /companies` binds its JSON
body to a `CompanyRequest`. Create operations return `200 OK` with an empty
response body.

### Application query parameters

`GET /applications` accepts the following optional query parameters:

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | UUID | Match one application ID. |
| `userId` | UUID | Filter by user. |
| `companyId` | UUID | Filter by company. |
| `position` | string | Case-insensitive partial match on position. |
| `jobType` | string | Case-insensitive exact match on job type. |
| `minSalary` | integer | Set the minimum salary. |
| `maxSalary` | integer | Set the maximum salary. |
| `status` | enum | Filter by application status. |
| `appliedAt` | date | Filter by application date (`YYYY-MM-DD`). |
| `createdAt` | date | Filter by creation date (`YYYY-MM-DD`). |
| `source` | string | Case-insensitive exact match on application source. |
| `sort` | string | Sort property; defaults to `createdAt`. See allowed values below. |
| `direction` | `ASC` or `DESC` | Sort direction; defaults to `DESC`. |
| `page` | integer | Zero-based page index; defaults to `0`. |
| `size` | integer | Page size from 1 to 100; defaults to `10`. |

The response is a Spring Data page object containing the results in its
`content` field along with pagination metadata. Supported sort values are `id`,
`createdAt`, `appliedAt`, `position`, `salary`, `status`, and `companyName`.

## Example Requests

Create a user:

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alex",
    "dob": "2000-01-15",
    "cv": "/path/to/cv.pdf"
  }'
```

Create a company with a JSON `CompanyRequest`:

```bash
curl -X POST http://localhost:8080/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Acme",
    "companyAddress": "Madrid, Spain",
    "bio": "Software company",
    "websiteUrl": "https://example.com"
  }'
```

Create a job application using existing user and company IDs:

```bash
USER_ID="<uuid-from-get-users>"
COMPANY_ID="<uuid-from-get-companies>"

curl -X POST http://localhost:8080/api/applications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"companyId\": \"$COMPANY_ID\",
    \"position\": \"Backend Developer\",
    \"jobType\": \"Full-time\",
    \"description\": \"Spring Boot API role\",
    \"salary\": 45000,
    \"status\": \"APPLIED\",
    \"appliedAt\": \"2026-08-20\",
    \"source\": \"LinkedIn\",
    \"postingLink\": \"https://example.com/jobs/backend-developer\"
  }"
```

List the first 10 applications:

```bash
curl http://localhost:8080/api/applications
```

Filter and sort applications:

```bash
curl "http://localhost:8080/api/applications?status=APPLIED&minSalary=40000&sort=appliedAt&direction=DESC&page=0&size=20"
```

## Status Values

Job applications support these statuses:

```text
SAVED
PREPARING
APPLIED
INTERVIEWING
OFFER
REJECTED
WITHDRAWN
```

Interviews support these statuses:

```text
SCHEDULED
COMPLETED
CANCELLED
RESCHEDULED
PASSED
FAILED
WAITING_FEEDBACK
```

## Error Responses

Errors use a consistent JSON wrapper:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [
      {
        "field": "username",
        "message": "Username not found"
      }
    ]
  }
}
```

Common error codes include:

| Code | Meaning |
| --- | --- |
| `VALIDATION_ERROR` | A request body failed validation. |
| `INVALID_REQUEST` | A request parameter or JSON body could not be parsed. |
| `NOT_FOUND` | A requested resource does not exist. |
| `CONFLICT` | A unique value already exists. |
| `INTERNAL_ERROR` | An unexpected server error occurred. |

## Project Structure

```text
CareerFlow/
|-- backend/
|   |-- .mvn/              # Maven Wrapper configuration
|   |-- .env               # Local backend variables (not committed)
|   |-- Dockerfile
|   |-- pom.xml
|   `-- src/
|       |-- main/
|       |   |-- java/app/careerflow/rs/
|       |   `-- resources/
|       `-- test/
|-- README.md
`-- api-plan.md
```

The backend Java packages are organized by feature:

```text
backend/src/main/java/app/careerflow/rs/
|-- common          # Shared errors and exception handling
|-- company         # Company domain, repository, service, controller
|-- contact         # Contact domain, repository, service, controller
|-- followup        # Follow-up task domain, repository, service, controller
|-- health          # Actuator database health check
|-- interview       # Interview domain, repository, service, controller
|-- job_application # Job application domain, repository, service, controller
|-- note            # Note domain, repository, service, controller
`-- user            # User domain, repository, service, controller
```

## Database

The schema includes these main tables:

- `users`
- `companies`
- `job_applications`
- `contacts`
- `interviews`
- `notes`
- `followups`

Flyway migration `V1__create_schema.sql` creates the initial schema and sample
data. Later migrations update the schema as the model evolves. The sample user,
company, application, contact, interview, note, and follow-up are inserted when
the initial migration runs.

## Development Notes

- API IDs are UUIDs.
- Dates use ISO format, for example `2026-08-20`.
- Backend configuration is consolidated in `backend/src/main/resources/application.properties`.
- Local datasource values are read automatically from `backend/.env`.
- JPA schema generation is set to `validate`; schema changes should be made through Flyway migrations.
- `api-plan.md` contains broader API planning notes beyond the endpoints currently implemented.
