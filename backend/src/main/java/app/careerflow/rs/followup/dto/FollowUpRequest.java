package app.careerflow.rs.followup.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record FollowUpRequest(
    @NotNull(message = "Application Id not found.") UUID applicationId,
    @NotNull(message = "Title not found.") String title,
    @NotNull(message = "Due date not specified") LocalDate dueDate,
    @NotNull(message = "Completion of follow up not specified") Boolean completed
) {
    
}
