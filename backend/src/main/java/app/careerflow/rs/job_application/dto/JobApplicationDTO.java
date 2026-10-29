package app.careerflow.rs.job_application.dto;

import java.time.Instant;
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
    String postingLink,
    Instant createdAt,
    Instant updatedAt
) {
    public JobApplicationDTO(
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
        this(id, userId, companyId, position, jobType, description, salary, status,
            appliedAt, source, postingLink, null, null);
    }
}
