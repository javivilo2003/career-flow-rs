package app.careerflow.rs.contact.dto;

import java.util.UUID;

public record ContactDTO(
    UUID id,
    UUID companyID,
    String name,
    String phone,
    String email,
    String jobRole
) {
    
}
