package app.careerflow.rs.followup.service;

import java.time.LocalDate;
import java.util.UUID;

public record FollowUpFilter(
    UUID id,
    UUID applicationId,
    String title,
    Boolean completed,
    LocalDate dueDateFrom,
    LocalDate dueDateTo
) {}
