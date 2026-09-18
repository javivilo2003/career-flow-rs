package app.careerflow.rs.interview.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import app.careerflow.rs.interview.domain.InterviewStatus;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

class InterviewRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validRequestHasNoValidationViolations() {
        InterviewRequest request = new InterviewRequest(
            UUID.randomUUID(), "Technical", InterviewStatus.SCHEDULED, null, null
        );

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void missingRequiredFieldsCreatesValidationViolations() {
        InterviewRequest request = new InterviewRequest(null, null, null, null, null);
        Set<ConstraintViolation<InterviewRequest>> violations = validator.validate(request);

        assertThat(violations)
            .extracting(violation -> violation.getPropertyPath().toString())
            .containsExactlyInAnyOrder("jobApplicationId", "stage", "status");
    }
}
