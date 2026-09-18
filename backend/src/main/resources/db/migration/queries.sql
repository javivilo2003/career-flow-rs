-- Write queries to list all applications.
SELECT * FROM job_applications;

-- Filter applications by status.
SELECT * FROM job_applications WHERE status = 'PREPARING';

-- Sort applications by date.
SELECT * 
FROM job_applications
ORDER BY applied_at DESC;

-- Join applications with companies.
SELECT companies.company_name, job_applications.position, job_applications.status
FROM job_applications
INNER JOIN companies ON job_applications.comapany_id = companies.id;

-- Find upcoming interviews.
SELECT * 
FROM interviews 
WHERE interview_date >= CURRENT_DATE
ORDER BY interview_date ASC;

-- Count applications by status.
SELECT status, COUNT(*) 
FROM job_applications
GROUP BY status;

-- Find contacts for a company.
SELECT contacts.name, contacts.email, contacts.job_role, companies.company_name
FROM contacts
INNER JOIN companies ON contacts.company_id = companies.id
WHERE companies.company_name = 'NVIDIA';

-- Find notes for an application.
SELECT job_applications.position, notes.content, notes.created_at
FROM notes
INNER JOIN job_applications ON notes.job_application_id = job_applications.id;

-- Find pending followups.
SELECT job_applications.position, followups.title, followups.due_date
FROM followups
INNER JOIN job_applications ON followups.job_application_id = job_applications.id
WHERE followups.completed = FALSE
ORDER BY followups.due_date ASC;

