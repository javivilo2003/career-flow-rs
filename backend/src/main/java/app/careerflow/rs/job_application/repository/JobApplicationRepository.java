package app.careerflow.rs.job_application.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import app.careerflow.rs.job_application.domain.JobApplication;

public interface JobApplicationRepository 
    extends JpaRepository<JobApplication, UUID>, 
            JpaSpecificationExecutor<JobApplication>{
}
