-- Existing timestamp-without-time-zone values were written as server timestamps.
-- CareerFlow treats those factual values as UTC when moving to absolute instants.
ALTER TABLE users
    ALTER COLUMN created_at TYPE TIMESTAMPTZ
        USING created_at AT TIME ZONE 'UTC';

ALTER TABLE companies
    ALTER COLUMN created_at TYPE TIMESTAMPTZ
        USING created_at AT TIME ZONE 'UTC';

ALTER TABLE job_applications
    ALTER COLUMN created_at TYPE TIMESTAMPTZ
        USING created_at AT TIME ZONE 'UTC',
    ADD COLUMN updated_at TIMESTAMPTZ,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE notes
    ALTER COLUMN created_at TYPE TIMESTAMPTZ
        USING created_at AT TIME ZONE 'UTC',
    ADD COLUMN updated_at TIMESTAMPTZ;

CREATE TABLE application_status_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    previous_status application_status,
    new_status application_status NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT application_status_events_application_fk
        FOREIGN KEY (application_id)
        REFERENCES job_applications(id)
        ON DELETE CASCADE
);

CREATE INDEX application_status_events_application_time_idx
    ON application_status_events (application_id, occurred_at, id);

CREATE INDEX application_status_events_status_time_idx
    ON application_status_events (new_status, occurred_at);

CREATE INDEX job_applications_status_created_at_idx
    ON job_applications (status, created_at);
