package app.careerflow.rs.note.dto;

import java.time.Instant;
import java.util.UUID;

public record NoteDTO(
    UUID id, 
    UUID jobApplicationId,
    String content,
    Instant createdAt,
    Instant updatedAt
) {
    public NoteDTO(UUID id, UUID jobApplicationId, String content) {
        this(id, jobApplicationId, content, null, null);
    }
}
