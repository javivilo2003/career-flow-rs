package app.careerflow.rs.job_application.dto;

import java.time.LocalDate;
import java.util.UUID;

import app.careerflow.rs.job_application.domain.ApplicationStatus;


public record JobApplicationDTO(
    UUID id,
    UUID userId,
    UUID companyId,
    String position,
    String jobType,
    String description,
    Integer salary,
    ApplicationStatus status,
    LocalDate appliedAt,
    String source,
    String postingLink
) {
    
}
