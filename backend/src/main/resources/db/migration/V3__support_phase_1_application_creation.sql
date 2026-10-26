ALTER TABLE job_applications
    ALTER COLUMN job_type DROP NOT NULL;

INSERT INTO users (id, username)
VALUES (
    '8bf7e93a-53a5-4a35-9ec8-2cf8f21a9c01',
    '__careerflow_internal_owner'
);

CREATE UNIQUE INDEX companies_company_name_lower_unique
    ON companies (LOWER(company_name));
