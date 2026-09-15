package app.careerflow.rs.job_application.service;

import java.time.LocalDate;
import java.util.UUID;

import app.careerflow.rs.job_application.domain.ApplicationStatus;

public record JobApplicationFilter(
    UUID id,
    UUID userId,
    UUID companyId,
    String position,
    String jobType,
    Integer minSalary,
    Integer maxSalary,
    ApplicationStatus status,
    LocalDate appliedAt,
    LocalDate createdAt,
    String source
) {}
