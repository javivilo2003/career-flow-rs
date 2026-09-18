package app.careerflow.rs.interview.dto;

import java.time.LocalDate;
import java.util.UUID;

import app.careerflow.rs.interview.domain.InterviewStatus;
import jakarta.validation.constraints.NotNull;

public record InterviewRequest(
    @NotNull(message = "Job application not found.") UUID jobApplicationId,
    @NotNull(message = "Interview process stage not found.") String stage,
    @NotNull(message = "Status of interview not found.")InterviewStatus status,
    LocalDate interviewDate,
    String notes
) {
    
}
