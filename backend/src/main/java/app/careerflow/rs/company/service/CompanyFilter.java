package app.careerflow.rs.company.service;

import java.time.LocalDate;
import java.util.UUID;

public record CompanyFilter(
    UUID id,
    String companyName,
    String address,
    String bio,
    String website,
    LocalDate createdAt
) {} 
