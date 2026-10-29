package app.careerflow.rs.job_application.dto;

import java.time.Instant;
import java.util.UUID;

import app.careerflow.rs.job_application.domain.ApplicationStatus;

public record ApplicationStatusEventDTO(
    UUID id,
    UUID applicationId,
    ApplicationStatus previousStatus,
    ApplicationStatus newStatus,
    Instant occurredAt
) {
}
