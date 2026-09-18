package app.careerflow.rs.job_application.dto;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import app.careerflow.rs.job_application.domain.ApplicationStatus;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

import static org.assertj.core.api.Assertions.assertThat;

class JobApplicationRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
    
    @Test
    void validRequestHasNoValidationViolations(){
        JobApplicationRequest request = new JobApplicationRequest(
            UUID.randomUUID(), 
            UUID.randomUUID(),
            "Backend Engineer",
            "Full-time",
            "Java/Spring role",
            120000,
            ApplicationStatus.APPLIED,
            LocalDate.of(2026, 8, 28),
            "LinkedIn",
            "https://example.com/jobs/123"
        );
        
        Set<ConstraintViolation<JobApplicationRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }

    @Test
    void missingRequiredFieldsCreatesValidationViolations() {
        JobApplicationRequest request = new JobApplicationRequest(
            null,
            null,
            null,
            null,
            "Optional description",
            null,
            null,
            null,
            null,
            null
        );

        Set<ConstraintViolation<JobApplicationRequest>> violations = validator.validate(request);

        assertThat(violations)
            .extracting(violation -> violation.getPropertyPath().toString())
            .containsExactlyInAnyOrder(
                "userId",
                "companyId",
                "position",
                "jobType",
                "status",
                "source"
            );
    }
}
