package app.careerflow.rs.note.dto;

import java.util.UUID;

public record NoteDTO(
    UUID id, 
    UUID jobApplicationId,
    String content
) {
    
}
