package com.pawsitters.service;

import com.pawsitters.exception.ForbiddenException;
import com.pawsitters.exception.NotFoundException;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@Service
public class UserService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir:uploads/users}")
    private String uploadDir;

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
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Ein User mit dieser E-Mail existiert bereits.");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhone(phone);
        user.setBirthDate(birthDate);
        user.setEmergencyContact(emergencyContact);
        user.setProfilePicture(profilePicture);
        user.setBio(bio);
        user.setAddress(null);
        user.setRating(0f);
        user.setNumberOfRatings(0);
        user.setRole(role);

        return userRepository.save(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User mit ID " + id + " nicht gefunden."));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("User mit E-Mail " + email + " nicht gefunden."));
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmailIgnoreCase(email);
    }

    public User getUserByEmail(String email) {
        return findByEmail(email);
    }

    public User updateUserForEmail(Long id,
                                   String ownerEmail,
                                   String firstName,
                                   String lastName,
                                   String phone,
                                   LocalDate birthDate,
                                   String emergencyContact,
                                   String profilePicture,
                                   String bio,
                                   String address) {
        User user = getUserByIdForEmail(id, ownerEmail);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhone(phone);
        user.setBirthDate(birthDate);
        user.setEmergencyContact(emergencyContact);
        user.setProfilePicture(profilePicture);
        user.setBio(bio);
        user.setAddress(address);
        return userRepository.save(user);
    }

    public User patchUserForEmail(Long id,
                                  String ownerEmail,
                                  String firstName,
                                  String lastName,
                                  String phone,
                                  LocalDate birthDate,
                                  String emergencyContact,
                                  String profilePicture,
                                  String bio,
                                  String address) {
        User user = getUserByIdForEmail(id, ownerEmail);
        if (firstName != null) {
            user.setFirstName(firstName);
        }
        if (lastName != null) {
            user.setLastName(lastName);
        }
        if (phone != null) {
            user.setPhone(phone);
        }
        if (birthDate != null) {
            user.setBirthDate(birthDate);
        }
        if (emergencyContact != null) {
            user.setEmergencyContact(emergencyContact);
        }
        if (profilePicture != null) {
            user.setProfilePicture(profilePicture);
        }
        if (bio != null) {
            user.setBio(bio);
        }
        if (address != null) {
            user.setAddress(address);
        }
        return userRepository.save(user);
    }

    public User updateRole(Long id, UserRole role) {
        User user = getUserById(id);
        user.setRole(role);
        return userRepository.save(user);
    }

    public void deleteUserForEmail(Long id, String ownerEmail) {
        User user = getUserByIdForEmail(id, ownerEmail);
        userRepository.delete(user);
    }

    public User uploadProfileImageForEmail(Long id, String ownerEmail, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Bitte ein Bild hochladen.");
        }
        String contentType = image.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Nur PNG-, JPEG- und WebP-Bilder sind erlaubt.");
        }
        if (image.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("Das Bild darf maximal 5 MB groß sein.");
        }
        try {
            if (!hasValidMagicBytes(image)) {
                throw new IllegalArgumentException("Datei-Signatur stimmt nicht mit dem angegebenen Bildtyp überein.");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Bild konnte nicht gelesen werden.");
        }

        User user = getUserByIdForEmail(id, ownerEmail);

        Path uploadPath = Paths.get(uploadDir);
        try {
            Files.createDirectories(uploadPath);
            String extension = extensionForContentType(contentType);
            String fileName = "user-" + user.getId() + "-" + UUID.randomUUID() + extension;
            Path target = uploadPath.resolve(fileName);
            try (InputStream inputStream = image.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            user.setProfilePicture(uploadPath.resolve(fileName).toString().replace("\\", "/"));
            return userRepository.save(user);
        } catch (IOException e) {
            throw new IllegalArgumentException("Bild konnte nicht gespeichert werden.");
        }
    }

    private User getUserByIdForEmail(Long id, String ownerEmail) {
        User user = getUserById(id);
        if (!user.getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new ForbiddenException("Kein Zugriff auf diesen Benutzer.");
        }
        return user;
    }

    private static boolean hasValidMagicBytes(MultipartFile image) throws IOException {
        byte[] header = new byte[12];
        int read;
        try (InputStream is = image.getInputStream()) {
            read = is.readNBytes(header, 0, 12);
        }
        if (read < 3) return false;
        // JPEG: FF D8 FF
        if (header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF) return true;
        // PNG: 89 50 4E 47
        if (read >= 4 && header[0] == (byte) 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) return true;
        // WebP: RIFF....WEBP (bytes 0-3 = 'RIFF', bytes 8-11 = 'WEBP')
        if (read >= 12
                && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
                && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50) return true;
        return false;
    }

    private static String extensionForContentType(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new IllegalArgumentException("Nicht unterstützter Bildtyp: " + contentType);
        };
    }
}
