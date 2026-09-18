package app.careerflow.rs.job_application.dto;

import java.time.LocalDate;
import java.util.UUID;

import app.careerflow.rs.job_application.domain.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record JobApplicationRequest(
    @NotNull(message = "User is required") UUID userId,
    @NotNull(message = "Company ID is required") UUID companyId,
    @NotNull(message = "Position is required") String position,
    @NotNull(message = "Job Type is required") String jobType,
    String description,
    Integer salary,
    @NotNull(message = "Application status is required") ApplicationStatus status,
    LocalDate appliedAt,
    @NotNull(message = "Source is required") String source,
    String postingLink
) {
    
}
