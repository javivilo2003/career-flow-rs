-- Supports initial-event cohort/coverage scans without indexing non-initial events.
CREATE INDEX application_status_events_initial_time_application_idx
    ON application_status_events (occurred_at, application_id)
    WHERE previous_status IS NULL;

-- Supports period activity counts and UTC daily grouping for genuine transitions.
CREATE INDEX application_status_events_transition_time_idx
    ON application_status_events (occurred_at)
    WHERE previous_status IS NOT NULL;

-- The V4 (status, created_at) index cannot serve created-at-only period activity scans.
CREATE INDEX job_applications_created_at_idx
    ON job_applications (created_at);
