package app.careerflow.rs.user.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

class UserRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validRequestHasNoValidationViolations() {
        assertThat(validator.validate(new UserRequest("javier", null, null))).isEmpty();
    }

    @Test
    void missingUsernameCreatesValidationViolation() {
        Set<ConstraintViolation<UserRequest>> violations = validator.validate(
            new UserRequest(null, null, null)
        );

        assertThat(violations)
            .extracting(violation -> violation.getPropertyPath().toString())
            .containsExactly("username");
    }
}
