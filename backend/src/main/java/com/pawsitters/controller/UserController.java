package com.pawsitters.controller;

import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@Validated
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
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.createUser(
                    request.email(),
                    request.password(),
                    request.firstName(),
                    request.lastName(),
                    request.phone(),
                    request.birthDate(),
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

    @GetMapping("/mailExists")
    public ResponseEntity<?> mailExists(@RequestParam @NotBlank @Email String mail) {
        boolean user = userService.existsByEmail(mail);
        return ResponseEntity.ok(user);
    }

    // ===== Request Body Record =====
    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank String firstName,
            @NotBlank String lastName,
            @NotBlank String phone,
            @NotNull @Past LocalDate birthDate,
            @NotBlank String emergencyContact,
            @NotBlank String profilePicture,
            @NotBlank String bio,
            @NotNull UserRole role
    ) {}
}