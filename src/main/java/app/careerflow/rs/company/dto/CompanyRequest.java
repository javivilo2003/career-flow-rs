package app.careerflow.rs.company.dto;

import org.hibernate.validator.constraints.URL;

import jakarta.validation.constraints.NotBlank;

public record CompanyRequest(
    @NotBlank (message = "Comapny needs a name.")String companyName,
    String companyAddress,
    String bio,
    @URL (message = "Website already exists.") String websiteUrl
) {}
