package app.careerflow.rs.job_application.repository;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.domain.JobApplication;

public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID>{

    Page<JobApplication> findByStatus(ApplicationStatus status, Pageable pageable);
}
