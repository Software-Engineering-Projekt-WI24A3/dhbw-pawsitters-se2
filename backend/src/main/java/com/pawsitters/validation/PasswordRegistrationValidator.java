package com.pawsitters.validation;

import com.pawsitters.dto.RegisterRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class PasswordRegistrationValidator implements ConstraintValidator<ValidPasswordRegistration, RegisterRequest> {

    private static final int MIN_LENGTH = 15;
    private static final int MAX_BCRYPT_BYTES = 72;
    private static final Set<String> BLOCKED_PASSWORD_PARTS = Set.of(
            "password",
            "passwort",
            "password123",
            "passwort123",
            "123456",
            "123456789",
            "111111",
            "000000",
            "aaaaaa",
            "abcdef",
            "abc123",
            "qwertz",
            "qwerty",
            "qwertz123",
            "qwerty123",
            "asdf",
            "admin",
            "admin123",
            "welcome",
            "letmein",
            "iloveyou",
            "monkey",
            "dragon",
            "football",
            "baseball",
            "master",
            "login",
            "secret",
            "changeme",
            "default",
            "pawsitters",
            "pawsitter",
            "petsitter",
            "tier",
            "hund",
            "katze",
            "sommer",
            "winter"
    );

    @Override
    public boolean isValid(RegisterRequest request, ConstraintValidatorContext context) {
        if (request == null) {
            return true;
        }

        List<String> violations = validate(
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

    private List<String> validate(String password, String email, String firstName, String lastName) {
        List<String> violations = new ArrayList<>();
        String normalizedPassword = PasswordNormalizer.normalize(password);

        if (normalizedPassword == null || normalizedPassword.isBlank()) {
            violations.add("Passwort darf nicht leer sein.");
            return violations;
        }

        if (normalizedPassword.codePointCount(0, normalizedPassword.length()) < MIN_LENGTH) {
            violations.add("Passwort muss mindestens 15 Zeichen lang sein.");
        }

        if (normalizedPassword.getBytes(StandardCharsets.UTF_8).length > MAX_BCRYPT_BYTES) {
            violations.add("Passwort darf maximal 72 Byte lang sein.");
        }

        if (containsEmailPart(normalizedPassword, email)) {
            violations.add("Passwort darf die E-Mail-Adresse oder den E-Mail-Namen nicht enthalten.");
        }

        if (containsPersonalContextPart(normalizedPassword, firstName, lastName)) {
            violations.add("Passwort darf keine Bestandteile deines Namens enthalten.");
        }

        if (containsBlockedPasswordPart(normalizedPassword)) {
            violations.add("Passwort ist zu leicht zu erraten.");
        }

        return violations;
    }

    private boolean containsEmailPart(String password, String email) {
        if (email == null || email.isBlank()) {
            return false;
        }

        String normalizedPassword = normalizeForComparison(password);
        String normalizedEmail = normalizeForComparison(email);
        String localPart = normalizeForComparison(email.split("@", 2)[0]);

        return normalizedPassword.contains(normalizedEmail)
                || (localPart.length() >= 3 && normalizedPassword.contains(localPart));
    }

    private boolean containsPersonalContextPart(String password, String firstName, String lastName) {
        String normalizedPassword = normalizeForComparison(password);
        return containsContextValue(normalizedPassword, firstName)
                || containsContextValue(normalizedPassword, lastName);
    }

    private boolean containsContextValue(String normalizedPassword, String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        String normalizedValue = normalizeForComparison(value);
        return normalizedValue.length() >= 3 && normalizedPassword.contains(normalizedValue);
    }

    private boolean containsBlockedPasswordPart(String password) {
        String normalized = normalizeAlphanumeric(password);
        String leetNormalized = normalizeForComparison(password);
        return BLOCKED_PASSWORD_PARTS.stream()
                .anyMatch(blockedPassword -> isBlockedPasswordOrSimpleVariant(normalized, blockedPassword)
                        || isBlockedPasswordOrSimpleVariant(leetNormalized, blockedPassword));
    }

    private boolean isBlockedPasswordOrSimpleVariant(String normalizedPassword, String blockedPassword) {
        if (normalizedPassword.equals(blockedPassword)) {
            return true;
        }

        if (!normalizedPassword.startsWith(blockedPassword)) {
            return false;
        }

        String suffix = normalizedPassword.substring(blockedPassword.length());
        return suffix.matches("\\d{1,8}") || suffix.matches("\\d{1,8}[a-z]{1,2}");
    }

    private String normalizeForComparison(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replace("@", "a")
                .replace("0", "o")
                .replace("1", "i")
                .replace("3", "e")
                .replace("4", "a")
                .replace("5", "s")
                .replace("7", "t")
                .replaceAll("[^a-z0-9]", "");
    }

    private String normalizeAlphanumeric(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }
}
