package com.pawsitters.controller;

import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Registriert einen neuen User.
     * POST /api/users/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.createUser(
                    request.email(),
                    request.password(),
                    request.firstName(),
                    request.lastName(),
                    request.phone(),
                    LocalDate.parse(request.birthDate()),
                    request.emergencyContact(),
                    request.profilePicture(),
                    request.bio(),
                    request.role()
            );
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Gibt einen User anhand seiner ID zurück.
     * GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/mailExists/{mail}")
    public ResponseEntity<?> mailExists(@PathVariable String mail) {
        try {
            boolean user = userService.existsByEmail(mail);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }

    }

    // ===== Request Body Record =====
    public record RegisterRequest(
            String email,
            String password,
            String firstName,
            String lastName,
            String phone,
            String birthDate,
            String emergencyContact,
            String profilePicture,
            String bio,
            UserRole role
    ) {}
}