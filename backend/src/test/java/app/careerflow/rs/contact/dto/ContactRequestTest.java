package app.careerflow.rs.contact.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

class ContactRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validRequestHasNoValidationViolations() {
        ContactRequest request = new ContactRequest(UUID.randomUUID(), "Ada", null, null, "CTO");

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void missingRequiredFieldsCreatesValidationViolations() {
        ContactRequest request = new ContactRequest(null, null, null, null, null);
        Set<ConstraintViolation<ContactRequest>> violations = validator.validate(request);

        assertThat(violations)
            .extracting(violation -> violation.getPropertyPath().toString())
            .containsExactlyInAnyOrder("companyId", "name", "jobRole");
    }
}
