package app.careerflow.rs.interview.dto;

import java.time.LocalDate;
import java.util.UUID;

import app.careerflow.rs.interview.domain.InterviewStatus;

public record InterviewDTO(
    UUID id,
    UUID jobApplicationId,
    String stage,
    InterviewStatus status,
    LocalDate interviewDate,
    String notes
) {
    
}
