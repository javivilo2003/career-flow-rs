package app.careerflow.rs.interview.service;

import java.time.LocalDate;
import java.util.UUID;

import app.careerflow.rs.interview.domain.InterviewStatus;

public record InterviewFilter(
    UUID id,
    UUID jobApplicationId,
    String stage,
    InterviewStatus status,
    LocalDate interviewDateFrom,
    LocalDate interviewDateTo
) {}
