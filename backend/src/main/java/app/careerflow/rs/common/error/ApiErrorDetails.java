package app.careerflow.rs.common.error;

public record ApiErrorDetails(
    String field,
    String message
) {}
