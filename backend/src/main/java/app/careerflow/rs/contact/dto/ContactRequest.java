package app.careerflow.rs.contact.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record ContactRequest(
    @NotNull(message = "Company not found.") UUID companyId,
    @NotNull(message = "Name needed.") String name,
    String phone,
    String email,
    @NotNull(message = "Contact needs a job role") String jobRole
) {
    
}
