package com.pawsitters.service;

import com.pawsitters.dto.HostProfileResponse;
import com.pawsitters.dto.HostStatsResponse;
import com.pawsitters.model.HostGalleryImage;
import com.pawsitters.model.HostProfile;
import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.HostProfileRepository;
import com.pawsitters.repository.HostReviewRepository;
import com.pawsitters.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class HostService {

    private static final String HOST_UPLOAD_DIRECTORY = "hosts";
    private static final Set<String> ALLOWED_GALLERY_IMAGE_EXTENSIONS =
            Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp");

    private final UserRepository userRepository;
    private final HostProfileRepository hostProfileRepository;
    private final HostReviewRepository hostReviewRepository;
    private final Path uploadRoot;
    private final long maxGalleryImageSizeBytes;

    public HostService(UserRepository userRepository,
                       HostProfileRepository hostProfileRepository,
                       HostReviewRepository hostReviewRepository,
                       @Value("${app.upload.dir:uploads}") String uploadDir,
                       @Value("${app.host-gallery-image.max-size-bytes:5242880}") long maxGalleryImageSizeBytes) {
        this.userRepository = userRepository;
        this.hostProfileRepository = hostProfileRepository;
        this.hostReviewRepository = hostReviewRepository;
        this.uploadRoot = Paths.get(uploadDir == null || uploadDir.isBlank() ? "uploads" : uploadDir)
                .toAbsolutePath()
                .normalize();
        this.maxGalleryImageSizeBytes = Math.max(1, maxGalleryImageSizeBytes);
    }

    @Transactional
    public HostProfileResponse createOrUpdateHostProfile(String hostEmail,
                                                         String bio,
                                                         String experience,
                                                         List<String> experiences,
                                                         String accommodationDescription,
                                                         Set<PetChoice> acceptedPetSpecies) {
        User host = getHostByEmail(hostEmail);
        HostProfile profile = hostProfileRepository.findByHostId(host.getId())
                .orElseGet(() -> {
                    HostProfile newProfile = new HostProfile();
                    newProfile.setHost(host);
                    return newProfile;
                });

        if (bio != null) {
            host.setBio(normalizeRequiredText("Biografie", bio));
        }
        if (acceptedPetSpecies != null) {
            host.setAcceptedPetSpecies(acceptedPetSpecies);
        }

        List<String> resolvedExperiences = resolveExperiences(profile, experience, experiences);
        profile.setExperiences(resolvedExperiences);
        profile.setExperience(resolveExperienceText(experience, resolvedExperiences));
        profile.setAccommodationDescription(resolveAccommodationDescription(profile, accommodationDescription));

        userRepository.save(host);
        HostProfile saved = hostProfileRepository.save(profile);
        return HostProfileResponse.from(saved, getHostStats(host.getId()));
    }

    @Transactional(readOnly = true)
    public HostProfileResponse getHostProfile(Long hostId) {
        getHostById(hostId);
        HostProfile profile = getExistingProfile(hostId);
        return HostProfileResponse.from(profile, getHostStats(hostId));
    }

    @Transactional(readOnly = true)
    public HostStatsResponse getHostStats(Long hostId) {
        getHostById(hostId);
        HostReviewRepository.HostReviewStatsProjection stats = hostReviewRepository.calculateStatsByHostId(hostId);
        return new HostStatsResponse(
                hostId,
                stats == null || stats.getReviewCount() == null ? 0L : stats.getReviewCount(),
                averageOrZero(stats == null ? null : stats.getAverageRating()),
                averageOrZero(stats == null ? null : stats.getAverageCommunicationRating()),
                averageOrZero(stats == null ? null : stats.getAverageReliabilityRating()),
                averageOrZero(stats == null ? null : stats.getAverageCareRating())
        );
    }

    @Transactional
    public HostProfileResponse addGalleryImage(Long hostId, String hostEmail, MultipartFile image) {
        User host = getHostByEmail(hostEmail);
        if (!host.getId().equals(hostId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Host kann nur die eigene Galerie bearbeiten.");
        }

        HostProfile profile = getExistingProfile(hostId);
        byte[] imageBytes = validateAndReadGalleryImage(image);
        String extension = extractExtension(image.getOriginalFilename());
        if (!ALLOWED_GALLERY_IMAGE_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Nur JPEG, PNG, GIF, WebP und BMP Dateien sind erlaubt.");
        }

        Path uploadDirectory = hostGalleryUploadDirectory(hostId);
        String filename = "host-" + hostId + "-" + UUID.randomUUID() + extension;
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

        HostGalleryImage galleryImage = new HostGalleryImage();
        galleryImage.setFilename(filename);
        galleryImage.setImagePath(hostGalleryPublicPrefix(hostId) + filename);
        galleryImage.setContentType(normalizeContentType(image.getContentType()));
        galleryImage.setSizeBytes(image.getSize());
        profile.addGalleryImage(galleryImage);

        try {
            HostProfile saved = hostProfileRepository.save(profile);
            return HostProfileResponse.from(saved, getHostStats(hostId));
        } catch (RuntimeException e) {
            deleteFileBestEffort(target);
            throw e;
        }
    }

    private User getHostByEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User nicht gefunden."));
        if (user.getRole() != UserRole.HOST) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nur Gastgeber koennen Host-Profile bearbeiten.");
        }
        return user;
    }

    private User getHostById(Long hostId) {
        User user = userRepository.findById(hostId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Host nicht gefunden."));
        if (user.getRole() != UserRole.HOST) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Host nicht gefunden.");
        }
        return user;
    }

    private HostProfile getExistingProfile(Long hostId) {
        return hostProfileRepository.findByHostId(hostId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Host-Profil nicht gefunden."));
    }

    private List<String> resolveExperiences(HostProfile profile, String experience, List<String> experiences) {
        if (experiences != null) {
            List<String> normalized = normalizeExperienceList(experiences);
            if (normalized.isEmpty()) {
                throw new IllegalArgumentException("Mindestens eine Erfahrung ist erforderlich.");
            }
            return normalized;
        }

        if (experience != null) {
            return List.of(normalizeRequiredText("Erfahrung", experience));
        }

        List<String> existing = profile.getExperiences();
        if (existing != null && !existing.isEmpty()) {
            return existing;
        }

        throw new IllegalArgumentException("Mindestens eine Erfahrung ist erforderlich.");
    }

    private String resolveExperienceText(String experience, List<String> experiences) {
        if (experience != null) {
            return normalizeRequiredText("Erfahrung", experience);
        }
        return String.join("\n", experiences);
    }

    private String resolveAccommodationDescription(HostProfile profile, String accommodationDescription) {
        if (accommodationDescription != null) {
            return normalizeRequiredText("Unterkunftsbeschreibung", accommodationDescription);
        }
        if (profile.getAccommodationDescription() != null && !profile.getAccommodationDescription().isBlank()) {
            return profile.getAccommodationDescription();
        }
        throw new IllegalArgumentException("Unterkunftsbeschreibung darf nicht leer sein.");
    }

    private List<String> normalizeExperienceList(List<String> experiences) {
        List<String> normalized = new ArrayList<>();
        for (String item : experiences) {
            normalized.add(normalizeRequiredText("Erfahrung", item));
        }
        return normalized;
    }

    private String normalizeRequiredText(String fieldName, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " darf nicht leer sein.");
        }
        return value.trim();
    }

    private Double averageOrZero(Double average) {
        return average == null ? 0.0 : average;
    }

    private byte[] validateAndReadGalleryImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Bitte ein Bild hochladen.");
        }
        if (image.getSize() > maxGalleryImageSizeBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Bild darf hoechstens 5 MB gross sein.");
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
        String raw = originalFilename.substring(index).toLowerCase(Locale.ROOT);
        if (raw.length() > 10 || !raw.matches("\\.[a-z0-9]+")) {
            return ".bin";
        }
        return raw;
    }

    private String normalizeContentType(String contentType) {
        return contentType == null || contentType.isBlank()
                ? "application/octet-stream"
                : contentType.trim().toLowerCase(Locale.ROOT);
    }

    private Path hostGalleryUploadDirectory(Long hostId) {
        return uploadRoot
                .resolve(HOST_UPLOAD_DIRECTORY)
                .resolve(String.valueOf(hostId))
                .resolve("gallery")
                .normalize();
    }

    private String hostGalleryPublicPrefix(Long hostId) {
        return "/uploads/hosts/" + hostId + "/gallery/";
    }

    private void deleteFileBestEffort(Path target) {
        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // Upload-Cleanup darf den API-Flow nicht blockieren.
        }
    }
}
