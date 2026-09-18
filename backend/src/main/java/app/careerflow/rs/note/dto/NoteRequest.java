package app.careerflow.rs.note.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NoteRequest(
    @NotNull(message = "Job application not found.") UUID jobApplicationId,
    @NotBlank(message = "Note content is required.") String content
) {
    
}
