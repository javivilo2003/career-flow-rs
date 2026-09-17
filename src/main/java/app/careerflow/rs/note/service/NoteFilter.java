package app.careerflow.rs.note.service;

import java.time.LocalDate;
import java.util.UUID;

public record NoteFilter(
    UUID id,
    UUID jobApplicationId,
    String content,
    LocalDate createdAt
) {}
