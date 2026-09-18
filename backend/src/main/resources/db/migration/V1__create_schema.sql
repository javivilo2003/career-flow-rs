-- Database schema:
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) UNIQUE NOT NULL,
    dob DATE,
    cv VARCHAR(255), 
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(80) UNIQUE NOT NULL,
    company_address TEXT,
    bio TEXT,
    website TEXT UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE application_status AS ENUM (
  'SAVED',
  'PREPARING',
  'APPLIED',
  'INTERVIEWING',
  'OFFER',
  'REJECTED',
  'WITHDRAWN'
);

CREATE TABLE job_applications(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    position TEXT NOT NULL,
    job_type TEXT NOT NULL,
    description TEXT,
    salary INTEGER,
    status application_status NOT NULL,
    applied_at DATE,
    source TEXT NOT NULL,
    posting_link TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE contacts(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    name VARCHAR(60) NOT NULL,
    phone VARCHAR(30),
    email TEXT UNIQUE,
    job_role TEXT NOT NULL,

    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TYPE interview_status AS ENUM (
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
  'RESCHEDULED',
  'PASSED',
  'FAILED',
  'WAITING_FEEDBACK'
);

CREATE TABLE interviews(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_application_id UUID NOT NULL,
    stage TEXT NOT NULL,
    status interview_status NOT NULL,
    interview_date DATE,
    notes TEXT,

    FOREIGN KEY (job_application_id) REFERENCES job_applications(id)
);

CREATE TABLE notes(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_application_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (job_application_id) REFERENCES job_applications(id)
);

CREATE TABLE followups(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_application_id UUID NOT NULL,
    title TEXT NOT NULL,
    due_date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (job_application_id) REFERENCES job_applications(id)
);

-- Seed Data:

INSERT INTO users(
	username, 
	dob, 
	cv
)
VALUES (
	'Javier', 
	'2003-03-14', 
	'/Users/javier/Documents/Codex/2026-08-10/mak/outputs/Javier_Viloria_CV_ES_junior_software_developer.pdf'
);

INSERT INTO companies(
	company_name, 
	company_address,
	bio, 
	website
)
VALUES (
	'NVIDIA', 
	'Santa Clara, CA', 
	'Computer Hardware Manufacturing', 
	'https://www.nvidia.com/en-us/'
);


INSERT INTO job_applications(
	user_id, 
	company_id, 
	position, 
	job_type, 
	description, 
	salary, 
	status, 
	applied_at, 
	source, 
	posting_link
)
VALUES (
	(select id from users where username = 'Javier'),
	(select id from companies where company_name = 'NVIDIA'),
	'Software Engineer, Infrastructure - DGX Cloud', 
	'Full-time', 
	'As a member of our NICo Software Development Team, you will be responsible for automating portions of the software development lifecycle, including using AI to automate the process of evaluating, dispatching, and tracking the progress of incoming software defects through their lifecycle. We have crafted a team of extraordinary people stretching around the globe, whose mission is to push the frontiers of what is possible today and define the platform for the future of computing.', 
	124000, 
	'PREPARING', 
	'2026-08-20', 
	'LinkedIn', 
	'https://www.linkedin.com/jobs/search-results/?currentJobId=4453750344&eBP=NON_CHARGEABLE_CHANNEL&refId=BxVLO%2FmNVYoUFLXjyuTpyg%3D%3D&trackingId=o23h5OEZKbN55velAtyvxA%3D%3D&keywords=jobs&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&geoId=102095887&f_C=3608'
);


insert into contacts(
	company_id,
	name,
	phone,
	email,
	job_role
)
values (
	(select id from companies where company_name = 'NVIDIA'),
	'Jensen Huang',
	'+1 4697421706',
	'jensenhuang@nvidia.com',
	'CEO'
);


insert into interviews(
	job_application_id,
	stage,
	status,
	interview_date,
	notes
)
values (
	(select id from job_applications where position = 'Software Engineer, Infrastructure - DGX Cloud'),
	'1st contact with HR',
	'SCHEDULED',
	'2026-08-25',
	'Prepare for a very technical interview'
);


insert into notes(
	job_application_id,
	content
)
values (
	(select id from job_applications where position = 'Software Engineer, Infrastructure - DGX Cloud'),
	'Prepare DGX Cloud for interview.'
);


insert into followups(
	job_application_id,
	title,
	due_date
)
values (
	(select id from job_applications where position = 'Software Engineer, Infrastructure - DGX Cloud'),
	'Technical Interview Appointment',
	'2026-08-26'
);
