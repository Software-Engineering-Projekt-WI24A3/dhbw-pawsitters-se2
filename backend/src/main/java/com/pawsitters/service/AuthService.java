package com.pawsitters.service;

import com.pawsitters.exception.NotFoundException;
import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.security.JwtService;
import com.pawsitters.security.RevokedTokenService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Set;

@Service
public class AuthService {

    private static final String INVALID_CREDENTIALS_MESSAGE = "Ungültige Credentials.";

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RevokedTokenService revokedTokenService;

    public AuthService(UserService userService,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       RevokedTokenService revokedTokenService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.revokedTokenService = revokedTokenService;
    }

    public AuthResult register(String email,
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
        User user = userService.createUser(
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
                postalCode,
                city,
                acceptedPetSpecies
        );
        return toAuthResult(user);
    }

    public AuthResult login(String email, String rawPassword) {
        User user;
        try {
            user = userService.findByEmail(email);
        } catch (NotFoundException e) {
            throw new BadCredentialsException(INVALID_CREDENTIALS_MESSAGE);
        }

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new BadCredentialsException(INVALID_CREDENTIALS_MESSAGE);
        }

        return toAuthResult(user);
    }

    public void logout(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        if (!jwtService.isTokenValid(token)) {
            return;
        }

        revokedTokenService.revoke(token, jwtService.extractExpiration(token).toInstant());
    }

    private AuthResult toAuthResult(User user) {
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResult(token, user.getRole().name());
    }

    public record AuthResult(String token, String role) {
    }
}

