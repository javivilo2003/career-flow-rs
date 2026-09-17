package app.careerflow.rs.followup.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

class FollowUpRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validRequestHasNoValidationViolations() {
        FollowUpRequest request = new FollowUpRequest(
            UUID.randomUUID(), "Send email", LocalDate.of(2026, 10, 1), false
        );

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void missingRequiredFieldsCreatesValidationViolations() {
        FollowUpRequest request = new FollowUpRequest(null, null, null, null);
        Set<ConstraintViolation<FollowUpRequest>> violations = validator.validate(request);

        assertThat(violations)
            .extracting(violation -> violation.getPropertyPath().toString())
            .containsExactlyInAnyOrder("applicationId", "title", "dueDate", "completed");
    }
}
