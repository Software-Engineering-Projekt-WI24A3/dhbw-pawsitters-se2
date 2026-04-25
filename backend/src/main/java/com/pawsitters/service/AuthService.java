package com.pawsitters.service;

import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class AuthService {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserService userService, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
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
                               UserRole role) {
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
                role
        );
        return toAuthResult(user);
    }

    public AuthResult login(String email, String rawPassword) {
        User user = userService.findByEmail(email);

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Ungueltige Credentials.");
        }

        return toAuthResult(user);
    }

    private AuthResult toAuthResult(User user) {
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResult(token, user.getRole().name());
    }

    public record AuthResult(String token, String role) {
    }
}

