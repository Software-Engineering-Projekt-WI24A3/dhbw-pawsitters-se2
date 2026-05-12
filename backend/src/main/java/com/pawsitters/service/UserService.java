package com.pawsitters.service;

import com.pawsitters.exception.ForbiddenException;
import com.pawsitters.exception.NotFoundException;
import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.UserRepository;
import com.pawsitters.validation.PasswordPolicy;
import com.pawsitters.validation.PasswordNormalizer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(
            String email,
            String rawPassword,
            String firstName,
            String lastName,
            String phone,
            LocalDate birthDate,
            String emergencyContact,
            String profilePicture,
            String bio,
            UserRole role
    ) {
        return createUser(
                email,
                rawPassword,
                firstName,
                lastName,
                phone,
                birthDate,
                emergencyContact,
                profilePicture,
                bio,
                role,
                null,
                null,
                null
        );
    }

    public User createUser(
            String email,
            String rawPassword,
            String firstName,
            String lastName,
            String phone,
            LocalDate birthDate,
            String emergencyContact,
            String profilePicture,
            String bio,
            UserRole role,
            String postalCode,
            String city,
            Set<PetChoice> acceptedPetSpecies
    ) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            throw new IllegalArgumentException("E-Mail darf nicht leer sein.");
        }
        if (role == UserRole.ADMIN) {
            throw new IllegalArgumentException("Die Rolle ADMIN kann nicht bei der Registrierung gesetzt werden.");
        }
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Ein User mit dieser E-Mail existiert bereits.");
        }
        String normalizedFirstName = normalizeRequiredText("Vorname", firstName);
        String normalizedLastName = normalizeRequiredText("Nachname", lastName);
        String normalizedPhone = normalizeRequiredText("Telefonnummer", phone);
        String normalizedEmergencyContact = normalizeRequiredText("Notfallkontakt", emergencyContact);
        String normalizedProfilePicture = normalizeRequiredText("Profilbild", profilePicture);
        String normalizedBio = normalizeRequiredText("Biografie", bio);
        String encodedPassword = encodeValidatedPassword(
                rawPassword,
                normalizedEmail,
                normalizedFirstName,
                normalizedLastName
        );

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(encodedPassword);
        user.setFirstName(normalizedFirstName);
        user.setLastName(normalizedLastName);
        user.setPhone(normalizedPhone);
        user.setBirthDate(birthDate);
        user.setEmergencyContact(normalizedEmergencyContact);
        user.setProfilePicture(normalizedProfilePicture);
        user.setBio(normalizedBio);
        user.setRating(0f);
        user.setNumberOfRatings(0);
        user.setRole(role);
        user.setPasswordChangeRequired(false);
        user.setPostalCode(normalizeBlank(postalCode));
        user.setCity(normalizeBlank(city));
        user.setAcceptedPetSpecies(acceptedPetSpecies);

        return userRepository.save(user);
    }
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "User mit ID " + id + " nicht gefunden."));
    }
    public User findByEmail(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            throw new NotFoundException("User mit E-Mail " + email + " nicht gefunden.");
        }
        return userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new NotFoundException(
                        "User mit E-Mail " + email + " nicht gefunden."));
    }
    public boolean existsByEmail(String email){
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            return false;
        }
        return userRepository.existsByEmailIgnoreCase(normalizedEmail);
    }

    public User updateUser(Long id,
                           String authenticatedEmail,
                           String nextEmail,
                           String rawPassword,
                           String firstName,
                           String lastName,
                           String phone,
                           LocalDate birthDate,
                           String emergencyContact,
                           String profilePicture,
                           String bio,
                           UserRole role,
                           String postalCode,
                           String city,
                           Set<PetChoice> acceptedPetSpecies) {
        User user = getUserById(id);
        if (!user.getEmail().equalsIgnoreCase(authenticatedEmail)) {
            throw new ForbiddenException("User kann nur sein eigenes Profil bearbeiten.");
        }

        String normalizedNextEmail = normalizeEmail(nextEmail);
        if (normalizedNextEmail == null || normalizedNextEmail.isBlank()) {
            throw new IllegalArgumentException("E-Mail darf nicht leer sein.");
        }
        if (!user.getEmail().equalsIgnoreCase(normalizedNextEmail)
                && userRepository.existsByEmailIgnoreCase(normalizedNextEmail)) {
            throw new IllegalArgumentException("Ein User mit dieser E-Mail existiert bereits.");
        }
        String normalizedFirstName = normalizeRequiredText("Vorname", firstName);
        String normalizedLastName = normalizeRequiredText("Nachname", lastName);
        String normalizedPhone = normalizeRequiredText("Telefonnummer", phone);
        String normalizedEmergencyContact = normalizeRequiredText("Notfallkontakt", emergencyContact);
        String normalizedProfilePicture = normalizeRequiredText("Profilbild", profilePicture);
        String normalizedBio = normalizeRequiredText("Biografie", bio);
        String encodedPassword = encodeValidatedPassword(
                rawPassword,
                normalizedNextEmail,
                normalizedFirstName,
                normalizedLastName
        );
        UserRole resolvedRole = resolveSelfManagedRole(user, role);

        user.setEmail(normalizedNextEmail);
        user.setPasswordHash(encodedPassword);
        user.setFirstName(normalizedFirstName);
        user.setLastName(normalizedLastName);
        user.setPhone(normalizedPhone);
        user.setBirthDate(birthDate);
        user.setEmergencyContact(normalizedEmergencyContact);
        user.setProfilePicture(normalizedProfilePicture);
        user.setBio(normalizedBio);
        user.setRole(resolvedRole);
        user.setPostalCode(normalizeBlank(postalCode));
        user.setCity(normalizeBlank(city));
        user.setAcceptedPetSpecies(acceptedPetSpecies);

        return userRepository.save(user);
    }

    public User patchUser(Long id,
                          String authenticatedEmail,
                          String nextEmail,
                          String rawPassword,
                          String firstName,
                          String lastName,
                          String phone,
                          LocalDate birthDate,
                          String emergencyContact,
                          String profilePicture,
                          String bio,
                          UserRole role,
                          String postalCode,
                          String city,
                          Set<PetChoice> acceptedPetSpecies) {
        User user = getUserById(id);
        if (!user.getEmail().equalsIgnoreCase(authenticatedEmail)) {
            throw new ForbiddenException("User kann nur sein eigenes Profil bearbeiten.");
        }

        String effectiveEmail = user.getEmail();
        if (nextEmail != null) {
            String normalizedNextEmail = normalizeEmail(nextEmail);
            if (normalizedNextEmail == null || normalizedNextEmail.isBlank()) {
                throw new IllegalArgumentException("E-Mail darf nicht leer sein.");
            }
            if (!user.getEmail().equalsIgnoreCase(normalizedNextEmail)
                    && userRepository.existsByEmailIgnoreCase(normalizedNextEmail)) {
                throw new IllegalArgumentException("Ein User mit dieser E-Mail existiert bereits.");
            }
            effectiveEmail = normalizedNextEmail;
        }
        String effectiveFirstName = firstName != null ? normalizeRequiredText("Vorname", firstName) : user.getFirstName();
        String effectiveLastName = lastName != null ? normalizeRequiredText("Nachname", lastName) : user.getLastName();
        if (rawPassword != null) {
            user.setPasswordHash(encodeValidatedPassword(rawPassword, effectiveEmail, effectiveFirstName, effectiveLastName));
        }

        user.setEmail(effectiveEmail);
        if (firstName != null) user.setFirstName(effectiveFirstName);
        if (lastName != null) user.setLastName(effectiveLastName);
        if (phone != null) user.setPhone(normalizeRequiredText("Telefonnummer", phone));
        if (birthDate != null) user.setBirthDate(birthDate);
        if (emergencyContact != null) user.setEmergencyContact(normalizeRequiredText("Notfallkontakt", emergencyContact));
        if (profilePicture != null) user.setProfilePicture(normalizeRequiredText("Profilbild", profilePicture));
        if (bio != null) user.setBio(normalizeRequiredText("Biografie", bio));
        if (role != null) user.setRole(resolveSelfManagedRole(user, role));
        if (postalCode != null) user.setPostalCode(normalizeBlank(postalCode));
        if (city != null) user.setCity(normalizeBlank(city));
        if (acceptedPetSpecies != null) user.setAcceptedPetSpecies(acceptedPetSpecies);

        return userRepository.save(user);
    }

    public void deleteUser(Long id, String email) {
        User user = getUserById(id);
        if (!user.getEmail().equalsIgnoreCase(email)) {
            throw new ForbiddenException("User kann nur sein eigenes Konto loeschen.");
        }
        userRepository.deleteById(id);
    }

    public User updateRole(Long id, UserRole role) {
        User user = getUserById(id);
        user.setRole(role);
        return userRepository.save(user);
    }

    public User updateProfileImage(Long id, String email, String profilePicture) {
        User user = getUserById(id);
        if (!user.getEmail().equalsIgnoreCase(email)) {
            throw new ForbiddenException("User kann nur sein eigenes Profilbild bearbeiten.");
        }
        String normalizedProfilePicture = normalizeRequiredText("Profilbild", profilePicture);
        user.setProfilePicture(normalizedProfilePicture);
        return userRepository.save(user);
    }

    private String normalizeBlank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeEmail(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }

    private String normalizeRequiredText(String fieldName, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " darf nicht leer sein.");
        }
        return value.trim();
    }

    private String encodeValidatedPassword(String rawPassword, String email, String firstName, String lastName) {
        List<String> passwordViolations = PasswordPolicy.validate(rawPassword, email, firstName, lastName);
        if (!passwordViolations.isEmpty()) {
            throw new IllegalArgumentException(passwordViolations.get(0));
        }
        return passwordEncoder.encode(PasswordNormalizer.normalize(rawPassword));
    }

    private UserRole resolveSelfManagedRole(User user, UserRole requestedRole) {
        if (requestedRole == UserRole.ADMIN && user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Die Rolle ADMIN kann nur über den Admin-Endpunkt gesetzt werden.");
        }
        return requestedRole;
    }
}
