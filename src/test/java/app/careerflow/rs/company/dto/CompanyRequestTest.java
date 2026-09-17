package app.careerflow.rs.company.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.Test;

public class CompanyRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test 
    void validRequestHasNoValidationViolations(){
        CompanyRequest request = new CompanyRequest(
            "Testing L.S.",
            null, 
            null, 
            null
        );

        Set<ConstraintViolation<CompanyRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }

    @Test 
    void missingRequiredFieldsCreatesValidationViolations(){
            CompanyRequest request = new CompanyRequest(
            null,
            "625 Parkway Blvd", 
            "Testing company requests", 
            "https://testingrequests.com/"
        );

        Set<ConstraintViolation<CompanyRequest>> violations = validator.validate(request);

        assertThat(violations)
            .extracting(violation -> violation.getPropertyPath().toString())
            .containsExactlyInAnyOrder("companyName");
    }
}
