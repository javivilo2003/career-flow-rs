package app.careerflow.rs.note.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

class NoteRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validRequestHasNoValidationViolations() {
        NoteRequest request = new NoteRequest(UUID.randomUUID(), "Follow up after interview");

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void missingRequiredFieldsCreatesValidationViolations() {
        NoteRequest request = new NoteRequest(null, " ");
        Set<ConstraintViolation<NoteRequest>> violations = validator.validate(request);

        assertThat(violations)
            .extracting(violation -> violation.getPropertyPath().toString())
            .containsExactlyInAnyOrder("jobApplicationId", "content");
    }
}
