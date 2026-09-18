package app.careerflow.rs.company.dto;

import java.util.UUID;

public record CompanyDTO(
    UUID id,
    String companyName,
    String companyAddress,
    String bio,
    String websiteUrl
) {
}
