package com.pawsitters.validation;

import com.pawsitters.dto.RegisterRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.List;

public class PasswordRegistrationValidator implements ConstraintValidator<ValidPasswordRegistration, RegisterRequest> {

    @Override
    public boolean isValid(RegisterRequest request, ConstraintValidatorContext context) {
        if (request == null) {
            return true;
        }

        List<String> violations = PasswordPolicy.validate(
                request.password(),
                request.email(),
                request.firstName(),
                request.lastName()
        );
        if (violations.isEmpty()) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        violations.forEach(message -> context
                .buildConstraintViolationWithTemplate(message)
                .addPropertyNode("password")
                .addConstraintViolation());
        return false;
    }
}
