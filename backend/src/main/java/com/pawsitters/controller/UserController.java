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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Validated
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
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/mailExists")
    public ResponseEntity<?> mailExists(@RequestParam @NotBlank @Email String mail) {
        boolean user = userService.existsByEmail(mail);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @Valid @RequestBody UpdateUserRequest request,
                                        Authentication authentication) {
        try {
            User user = userService.updateUserForEmail(
                    id,
                    authentication.getName(),
                    request.firstName(),
                    request.lastName(),
                    request.phone(),
                    request.birthDate(),
                    request.emergencyContact(),
                    request.profilePicture(),
                    request.bio(),
                    request.address()
            );
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> patchUser(@PathVariable Long id,
                                       @Valid @RequestBody PatchUserRequest request,
                                       Authentication authentication) {
        try {
            User user = userService.patchUserForEmail(
                    id,
                    authentication.getName(),
                    request.firstName(),
                    request.lastName(),
                    request.phone(),
                    request.birthDate(),
                    request.emergencyContact(),
                    request.profilePicture(),
                    request.bio(),
                    request.address()
            );
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        userService.deleteUserForEmail(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/roles")
    public ResponseEntity<?> updateRole(@PathVariable Long id,
                                        @Valid @RequestBody RolePatchRequest request) {
        User user = userService.updateRole(id, request.role());
        return ResponseEntity.ok(user);
    }

    @PostMapping(value = "/{id}/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadProfileImage(@PathVariable Long id,
                                                @RequestPart("image") MultipartFile image,
                                                Authentication authentication) {
        try {
            User user = userService.uploadProfileImageForEmail(id, authentication.getName(), image);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ===== Request Body Records =====
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

    public record UpdateUserRequest(
            @NotBlank String firstName,
            @NotBlank String lastName,
            @NotBlank String phone,
            @NotNull @Past LocalDate birthDate,
            @NotBlank String emergencyContact,
            @NotBlank String profilePicture,
            @NotBlank String bio,
            String address
    ) {}

    public record PatchUserRequest(
            String firstName,
            String lastName,
            String phone,
            @Past LocalDate birthDate,
            String emergencyContact,
            String profilePicture,
            String bio,
            String address
    ) {}

    public record RolePatchRequest(@NotNull UserRole role) {}
}
