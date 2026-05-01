package com.pawsitters.service;

import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;

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
                .orElseThrow(() -> new IllegalArgumentException(
                        "User mit ID " + id + " nicht gefunden."));
    }
    public User findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User mit E-Mail " + email + " nicht gefunden."));
    }
    public boolean existsByEmail(String email){
        return (userRepository.existsByEmailIgnoreCase(email));
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

    public User updateRoleForEmail(Long id, String ownerEmail, UserRole role) {
        User user = getUserByIdForEmail(id, ownerEmail);
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
        if (image.getContentType() == null || !image.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("Nur Bilddateien sind erlaubt.");
        }

        User user = getUserByIdForEmail(id, ownerEmail);

        byte[] imageBytes;
        try {
            imageBytes = image.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("Bild konnte nicht gelesen werden.");
        }

        Path uploadDir = Paths.get("uploads", "users");
        try {
            Files.createDirectories(uploadDir);
            String extension = extractExtension(image.getOriginalFilename());
            Path target = uploadDir.resolve("user-" + user.getId() + "-" + UUID.randomUUID() + extension);
            Files.write(target, imageBytes);
            user.setProfilePicture(target.toString().replace("\\", "/"));
            return userRepository.save(user);
        } catch (IOException e) {
            throw new IllegalArgumentException("Bild konnte nicht gespeichert werden.");
        }
    }

    private User getUserByIdForEmail(Long id, String ownerEmail) {
        User user = getUserById(id);
        if (!user.getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new IllegalArgumentException("Kein Zugriff auf diesen Benutzer.");
        }
        return user;
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
        if (raw.length() > 10) {
            return ".bin";
        }
        return raw;
    }
}
