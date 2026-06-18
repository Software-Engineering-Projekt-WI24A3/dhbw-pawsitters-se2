package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.DeleteResponse;
import com.pawsitters.dto.MailExistsResponse;
import com.pawsitters.dto.RegisterRequest;
import com.pawsitters.dto.RoleUpdateRequest;
import com.pawsitters.dto.UserPatchRequest;
import com.pawsitters.dto.UserRatingRequest;
import com.pawsitters.dto.UserRatingResponse;
import com.pawsitters.dto.UserResponse;
import com.pawsitters.dto.UserUpdateRequest;
import com.pawsitters.model.User;
import com.pawsitters.service.UserRatingService;
import com.pawsitters.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRatingService userRatingService;

    public UserController(UserService userService, UserRatingService userRatingService) {
        this.userService = userService;
        this.userRatingService = userRatingService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request,
                                                              HttpServletRequest servletRequest) {
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
                request.role(),
                request.postalCode(),
                request.city(),
                request.acceptedPetSpecies()
        );

        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "User registered successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id,
                                                             HttpServletRequest servletRequest) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "User retrieved successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @GetMapping("/mailExists")
    public ResponseEntity<ApiResponse<MailExistsResponse>> mailExists(@RequestParam @NotBlank @Email String mail,
                                                                      HttpServletRequest servletRequest) {
        boolean exists = userService.existsByEmail(mail);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Mail existence checked successfully.",
                new MailExistsResponse(exists),
                servletRequest.getRequestURI()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(Authentication authentication,
                                                           HttpServletRequest servletRequest) {
        User user = userService.findByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Current user retrieved successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @PostMapping("/{id}/ratings")
    public ResponseEntity<ApiResponse<UserRatingResponse>> rateUser(@PathVariable Long id,
                                                                    @Valid @RequestBody UserRatingRequest request,
                                                                    Authentication authentication,
                                                                    HttpServletRequest servletRequest) {
        UserRatingResponse rating = userRatingService.rateUser(
                requireAuthenticatedEmail(authentication),
                id,
                request.rating()
        );
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "User rating saved successfully.",
                rating,
                servletRequest.getRequestURI()
        ));
    }

    @GetMapping("/{id}/ratings/me")
    public ResponseEntity<ApiResponse<UserRatingResponse>> getOwnRatingForUser(@PathVariable Long id,
                                                                               Authentication authentication,
                                                                               HttpServletRequest servletRequest) {
        UserRatingResponse rating = userRatingService.getOwnRatingForUser(
                requireAuthenticatedEmail(authentication),
                id
        );
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "User rating retrieved successfully.",
                rating,
                servletRequest.getRequestURI()
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable Long id,
                                                                @Valid @RequestBody UserUpdateRequest request,
                                                                Authentication authentication,
                                                                HttpServletRequest servletRequest) {
        User user = userService.updateUser(
                id,
                authentication.getName(),
                request.email(),
                request.password(),
                request.firstName(),
                request.lastName(),
                request.phone(),
                request.birthDate(),
                request.emergencyContact(),
                request.profilePicture(),
                request.bio(),
                request.role(),
                request.postalCode(),
                request.city(),
                request.acceptedPetSpecies()
        );
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "User updated successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> patchUser(@PathVariable Long id,
                                                               @Valid @RequestBody UserPatchRequest request,
                                                               Authentication authentication,
                                                               HttpServletRequest servletRequest) {
        User user = userService.patchUser(
                id,
                authentication.getName(),
                request.email(),
                request.password(),
                request.firstName(),
                request.lastName(),
                request.phone(),
                request.birthDate(),
                request.emergencyContact(),
                request.profilePicture(),
                request.bio(),
                request.role(),
                request.postalCode(),
                request.city(),
                request.acceptedPetSpecies()
        );
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "User patched successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<DeleteResponse>> deleteUser(@PathVariable Long id,
                                                                  Authentication authentication,
                                                                  HttpServletRequest servletRequest) {
        userService.deleteUser(id, authentication.getName());
        String message = "User wurde erfolgreich gelöscht.";
        DeleteResponse deleted = new DeleteResponse(true, id, message);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                message,
                deleted,
                servletRequest.getRequestURI()
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(@PathVariable Long id,
                                                                @Valid @RequestBody RoleUpdateRequest request,
                                                                HttpServletRequest servletRequest) {
        User user = userService.updateRole(id, request.role());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "User role updated successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @PostMapping("/{id}/profile-image")
    public ResponseEntity<ApiResponse<UserResponse>> uploadProfileImage(@PathVariable Long id,
                                                                        @RequestParam(value = "file", required = false) MultipartFile file,
                                                                        @RequestParam(value = "image", required = false) MultipartFile image,
                                                                        Authentication authentication,
                                                                        HttpServletRequest servletRequest) {
        MultipartFile upload = file != null ? file : image;
        String authenticatedEmail = requireAuthenticatedEmail(authentication);
        User user = userService.uploadProfileImage(id, authenticatedEmail, upload);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Profile image uploaded successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @DeleteMapping("/{id}/profile-image")
    public ResponseEntity<ApiResponse<UserResponse>> deleteProfileImage(@PathVariable Long id,
                                                                        Authentication authentication,
                                                                        HttpServletRequest servletRequest) {
        String authenticatedEmail = requireAuthenticatedEmail(authentication);
        User user = userService.deleteProfileImage(id, authenticatedEmail);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Profile image deleted successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    private String requireAuthenticatedEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication required.");
        }
        return authentication.getName();
    }

    private String sanitizeUploadFilename(String rawFilename) {
        String original = StringUtils.hasText(rawFilename) ? rawFilename.trim() : "profile-image";
        String normalizedSeparators = original.replace('\\', '/');
        int lastSlash = normalizedSeparators.lastIndexOf('/');
        String safe = lastSlash >= 0 ? normalizedSeparators.substring(lastSlash + 1) : normalizedSeparators;
        return safe.isBlank() ? "profile-image" : safe;
    }

    private String resolveImageExtension(String contentType, String safeFilename) {
        String lowerFilename = safeFilename.toLowerCase();
        if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) {
            return ".jpg";
        }
        if (lowerFilename.endsWith(".png")) {
            return ".png";
        }
        if (lowerFilename.endsWith(".gif")) {
            return ".gif";
        }
        if (lowerFilename.endsWith(".webp")) {
            return ".webp";
        }
        if (lowerFilename.endsWith(".bmp")) {
            return ".bmp";
        }

        String normalizedContentType = contentType == null ? "" : contentType.trim().toLowerCase();
        return switch (normalizedContentType) {
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            case "image/bmp" -> ".bmp";
            default -> throw new IllegalArgumentException("Nur JPEG, PNG, GIF, WebP und BMP Dateien sind erlaubt.");
        };
    }
}
