package app.careerflow.rs.contact.service;

import java.util.UUID;

public record ContactFilter(
    UUID id,
    UUID companyId,
    String name,
    String email,
    String jobRole
) {}
