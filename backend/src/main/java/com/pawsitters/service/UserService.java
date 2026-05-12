package com.pawsitters.service;

import com.pawsitters.exception.ForbiddenException;
import com.pawsitters.exception.NotFoundException;
import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.UserRepository;
import com.pawsitters.validation.PasswordNormalizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class UserService {

    public static final String DEFAULT_PROFILE_PICTURE = "/assets/media/pawsitters-scene.svg";

    private static final String LEGACY_FAVICON_PROFILE_PICTURE = "/assets/media/favicon.png";
    private static final String PROFILE_UPLOAD_DIRECTORY = "profiles";
    private static final String PROFILE_UPLOAD_PUBLIC_PREFIX = "/uploads/profiles/";
    private static final Set<String> ALLOWED_PROFILE_IMAGE_EXTENSIONS =
            Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Path uploadRoot;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       @Value("${app.upload.dir:uploads}") String uploadDir) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.uploadRoot = Paths.get(uploadDir == null || uploadDir.isBlank() ? "uploads" : uploadDir)
                .toAbsolutePath()
                .normalize();
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
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Ein User mit dieser E-Mail existiert bereits.");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(PasswordNormalizer.normalize(rawPassword)));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhone(phone);
        user.setBirthDate(birthDate);
        user.setEmergencyContact(emergencyContact);
        user.setProfilePicture(profilePictureOrDefault(profilePicture));
        user.setBio(bio);
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
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException(
                        "User mit E-Mail " + email + " nicht gefunden."));
    }
    public boolean existsByEmail(String email){
        return (userRepository.existsByEmailIgnoreCase(email));
    }

    public User updateUser(Long id, String email, String firstName, String lastName, String phone,
                           LocalDate birthDate, String emergencyContact, String profilePicture, String bio) {
        User user = getUserById(id);
        if (!user.getEmail().equalsIgnoreCase(email)) {
            throw new ForbiddenException("User kann nur sein eigenes Profil bearbeiten.");
        }
        
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhone(phone);
        user.setBirthDate(birthDate);
        user.setEmergencyContact(emergencyContact);
        user.setProfilePicture(profilePictureOrDefault(profilePicture));
        user.setBio(bio);
        
        return userRepository.save(user);
    }

    public User patchUser(Long id, String email, String firstName, String lastName, String phone,
                          LocalDate birthDate, String emergencyContact, String profilePicture, String bio) {
        User user = getUserById(id);
        if (!user.getEmail().equalsIgnoreCase(email)) {
            throw new ForbiddenException("User kann nur sein eigenes Profil bearbeiten.");
        }
        
        if (firstName != null) user.setFirstName(firstName);
        if (lastName != null) user.setLastName(lastName);
        if (phone != null) user.setPhone(phone);
        if (birthDate != null) user.setBirthDate(birthDate);
        if (emergencyContact != null) user.setEmergencyContact(emergencyContact);
        if (profilePicture != null) user.setProfilePicture(profilePictureOrDefault(profilePicture));
        if (bio != null) user.setBio(bio);
        
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
        assertOwnProfileImage(user, email);
        user.setProfilePicture(profilePictureOrDefault(profilePicture));
        return userRepository.save(user);
    }

    @Transactional
    public User uploadProfileImage(Long id, String email, MultipartFile image) {
        User user = getUserById(id);
        assertOwnProfileImage(user, email);

        byte[] imageBytes = validateAndReadProfileImage(image);
        String extension = extractExtension(image.getOriginalFilename());
        if (!ALLOWED_PROFILE_IMAGE_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Nur JPEG, PNG, GIF, WebP und BMP Dateien sind erlaubt.");
        }

        Path uploadDirectory = profileUploadDirectory();
        String filename = "user-" + user.getId() + "-" + UUID.randomUUID() + extension;
        Path target = uploadDirectory.resolve(filename).normalize();
        if (!target.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException("Ungueltiger Dateiname.");
        }

        try {
            Files.createDirectories(uploadDirectory);
            Files.write(target, imageBytes);
        } catch (IOException e) {
            throw new IllegalArgumentException("Bild konnte nicht gespeichert werden.");
        }

        String oldProfilePicture = user.getProfilePicture();
        user.setProfilePicture(PROFILE_UPLOAD_PUBLIC_PREFIX + filename);

        try {
            User saved = userRepository.save(user);
            deleteUploadedProfileImageIfPresent(oldProfilePicture);
            return saved;
        } catch (RuntimeException e) {
            deleteFileBestEffort(target);
            throw e;
        }
    }

    @Transactional
    public User deleteProfileImage(Long id, String email) {
        User user = getUserById(id);
        assertOwnProfileImage(user, email);

        String oldProfilePicture = user.getProfilePicture();
        user.setProfilePicture(DEFAULT_PROFILE_PICTURE);
        User saved = userRepository.save(user);
        deleteUploadedProfileImageIfPresent(oldProfilePicture);
        return saved;
    }

    private String normalizeBlank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void assertOwnProfileImage(User user, String email) {
        if (!user.getEmail().equalsIgnoreCase(email)) {
            throw new ForbiddenException("User kann nur sein eigenes Profilbild bearbeiten.");
        }
    }

    private String profilePictureOrDefault(String profilePicture) {
        if (profilePicture == null || profilePicture.isBlank()) {
            return DEFAULT_PROFILE_PICTURE;
        }

        String trimmed = profilePicture.trim();
        return LEGACY_FAVICON_PROFILE_PICTURE.equals(trimmed) ? DEFAULT_PROFILE_PICTURE : trimmed;
    }

    private byte[] validateAndReadProfileImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Bitte ein Bild hochladen.");
        }
        String contentType = image.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new IllegalArgumentException("Nur Bilddateien sind erlaubt.");
        }

        byte[] imageBytes;
        try {
            imageBytes = image.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("Bild konnte nicht gelesen werden.");
        }

        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(imageBytes)) {
            BufferedImage bufferedImage = ImageIO.read(inputStream);
            if (bufferedImage == null) {
                throw new IllegalArgumentException("Die Datei ist kein gueltiges Bild.");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Die Datei ist kein gueltiges Bild.");
        }

        return imageBytes;
    }

    private String extractExtension(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return ".bin";
        }
        int index = originalFilename.lastIndexOf('.');
        if (index < 0 || index == originalFilename.length() - 1) {
            return ".bin";
        }
        String raw = originalFilename.substring(index).toLowerCase();
        if (raw.length() > 10 || !raw.matches("\\.[a-z0-9]+")) {
            return ".bin";
        }
        return raw;
    }

    private Path profileUploadDirectory() {
        return uploadRoot.resolve(PROFILE_UPLOAD_DIRECTORY).normalize();
    }

    private void deleteUploadedProfileImageIfPresent(String profilePicture) {
        if (profilePicture == null || !profilePicture.startsWith(PROFILE_UPLOAD_PUBLIC_PREFIX)) {
            return;
        }

        String filename = profilePicture.substring(PROFILE_UPLOAD_PUBLIC_PREFIX.length());
        if (filename.isBlank()) {
            return;
        }

        Path uploadDirectory = profileUploadDirectory();
        Path target = uploadDirectory.resolve(filename).normalize();
        if (!target.startsWith(uploadDirectory)) {
            return;
        }

        deleteFileBestEffort(target);
    }

    private void deleteFileBestEffort(Path target) {
        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // Alte Upload-Dateien sind optionales Cleanup und sollen den API-Flow nicht blockieren.
        }
    }
}
