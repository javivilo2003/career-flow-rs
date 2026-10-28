package app.careerflow.rs.followup.dto;

import java.time.LocalDate;
import java.util.UUID;

public record FollowUpDTO(
    UUID id,
    UUID applicationId,
    String title,
    LocalDate dueDate,
    boolean completed
) {
    public FollowUpDTO(UUID applicationId, String title, LocalDate dueDate, boolean completed) {
        this(null, applicationId, title, dueDate, completed);
    }
}
