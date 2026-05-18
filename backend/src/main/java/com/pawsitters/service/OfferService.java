package com.pawsitters.service;

import com.pawsitters.model.Offer;
import com.pawsitters.model.OfferStatus;
import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.OfferRepository;
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
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class OfferService {

    private static final String OFFER_UPLOAD_DIRECTORY = "offers";
    private static final String OFFER_UPLOAD_PUBLIC_PREFIX = "/uploads/offers/";
    private static final Set<String> ALLOWED_OFFER_IMAGE_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp");

    private final OfferRepository offerRepository;
    private final UserRepository userRepository;
    private final Path uploadRoot;
    private final long maxOfferImageSizeBytes;

    public OfferService(OfferRepository offerRepository,
                        UserRepository userRepository,
                        @Value("${app.upload.dir:uploads}") String uploadDir,
                        @Value("${app.offer-image.max-size-bytes:5242880}") long maxOfferImageSizeBytes) {
        this.offerRepository = offerRepository;
        this.userRepository = userRepository;
        this.uploadRoot = Paths.get(uploadDir == null || uploadDir.isBlank() ? "uploads" : uploadDir)
                .toAbsolutePath()
                .normalize();
        this.maxOfferImageSizeBytes = maxOfferImageSizeBytes;
    }

    @Transactional
    public Offer createOfferForHostEmail(String hostEmail,
                                         String title,
                                         String location,
                                         String description,
                                         BigDecimal pricePerDay,
                                         Set<PetChoice> acceptedPetSpecies,
                                         List<String> services,
                                         LocalDate availableFrom,
                                         LocalDate availableTo) {
        User host = ensureHostByEmail(hostEmail);
        validateAvailabilityRange(availableFrom, availableTo);

        Offer offer = new Offer();
        offer.setHost(host);
        offer.setTitle(title.trim());
        offer.setLocation(normalizeBlank(location));
        offer.setDescription(description.trim());
        offer.setPricePerDay(pricePerDay);
        offer.setAcceptedPetSpecies(new LinkedHashSet<>(acceptedPetSpecies));
        offer.setServices(new ArrayList<>(services.stream().map(String::trim).toList()));
        offer.setAvailableFrom(availableFrom);
        offer.setAvailableTo(availableTo);
        offer.setStatus(OfferStatus.DRAFT);

        return offerRepository.save(offer);
    }

    @Transactional
    public Offer publishOfferForHostEmail(Long offerId, String hostEmail) {
        Offer offer = getOwnedOffer(offerId, hostEmail);
        offer.setStatus(OfferStatus.PUBLISHED);
        return offerRepository.save(offer);
    }

    @Transactional
    public Offer updateDraftOfferForHostEmail(Long offerId,
                                              String hostEmail,
                                              String title,
                                              String location,
                                              String description,
                                              BigDecimal pricePerDay,
                                              Set<PetChoice> acceptedPetSpecies,
                                              List<String> services,
                                              LocalDate availableFrom,
                                              LocalDate availableTo) {
        Offer offer = getOwnedOffer(offerId, hostEmail);
        if (offer.getStatus() != OfferStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nur Entwürfe können bearbeitet werden.");
        }
        validateAvailabilityRange(availableFrom, availableTo);

        offer.setTitle(title.trim());
        offer.setLocation(normalizeBlank(location));
        offer.setDescription(description.trim());
        offer.setPricePerDay(pricePerDay);
        offer.setAcceptedPetSpecies(new LinkedHashSet<>(acceptedPetSpecies));
        offer.setServices(new ArrayList<>(services.stream().map(String::trim).toList()));
        offer.setAvailableFrom(availableFrom);
        offer.setAvailableTo(availableTo);

        return offerRepository.save(offer);
    }

    @Transactional(readOnly = true)
    public Offer getOfferForHostEmail(Long offerId, String hostEmail) {
        return getOwnedOffer(offerId, hostEmail);
    }

    @Transactional(readOnly = true)
    public List<Offer> getOffersForUserEmail(String userEmail) {
        User user = getUserByEmail(userEmail);
        return offerRepository.findByHostIdOrderByIdDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public List<Offer> getProfileOffersForHostId(Long hostId, String requesterEmail) {
        User host = userRepository.findById(hostId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User nicht gefunden."));
        return offerRepository.findByHostIdOrderByIdDesc(host.getId()).stream()
                .filter((offer) -> offer.getStatus() == OfferStatus.PUBLISHED)
                .toList();
    }

    @Transactional
    public Offer withdrawOfferForHostEmail(Long offerId, String hostEmail) {
        Offer offer = getOwnedOffer(offerId, hostEmail);
        offer.setStatus(OfferStatus.DRAFT);
        return offerRepository.save(offer);
    }

    @Transactional
    public Offer uploadOfferImageForHostEmail(Long offerId, String hostEmail, MultipartFile image) {
        Offer offer = getOwnedOffer(offerId, hostEmail);

        byte[] imageBytes = validateAndReadOfferImage(image);
        String extension = extractExtension(image.getOriginalFilename());
        if (!ALLOWED_OFFER_IMAGE_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Nur JPEG, PNG, GIF, WebP und BMP Dateien sind erlaubt.");
        }

        Path uploadDirectory = offerUploadDirectory();
        String filename = "offer-" + offer.getId() + "-" + UUID.randomUUID() + extension;
        Path target = uploadDirectory.resolve(filename).normalize();
        if (!target.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException("Ungültiger Dateiname.");
        }

        try {
            Files.createDirectories(uploadDirectory);
            Files.write(target, imageBytes);
        } catch (IOException e) {
            throw new IllegalArgumentException("Bild konnte nicht gespeichert werden.");
        }

        String oldImagePath = offer.getImagePath();
        offer.setImagePath(OFFER_UPLOAD_PUBLIC_PREFIX + filename);

        try {
            Offer saved = offerRepository.save(offer);
            deleteUploadedOfferImageIfPresent(oldImagePath);
            return saved;
        } catch (RuntimeException e) {
            deleteFileBestEffort(target);
            throw e;
        }
    }

    private Offer getOwnedOffer(Long offerId, String hostEmail) {
        return offerRepository.findByIdAndHostEmail(offerId, hostEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Angebot nicht gefunden."));
    }

    private User ensureHostByEmail(String hostEmail) {
        User user = getUserByEmail(hostEmail);
        if (user.getRole() == UserRole.HOST) {
            return user;
        }
        if (user.getRole() == UserRole.PET_OWNER) {
            user.setRole(UserRole.HOST);
            return userRepository.save(user);
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nur Gastgeber können Angebote erstellen.");
    }

    private User getUserByEmail(String userEmail) {
        return userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User nicht gefunden."));
    }

    private void validateAvailabilityRange(LocalDate availableFrom, LocalDate availableTo) {
        if (availableFrom == null || availableTo == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Bitte gib einen gültigen Betreuungszeitraum an."
            );
        }

        LocalDate today = LocalDate.now();
        if (availableFrom.isBefore(today) || availableTo.isBefore(today)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Der Betreuungszeitraum darf nicht in der Vergangenheit liegen."
            );
        }

        if (availableTo.isBefore(availableFrom)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Der Zeitraum ist ungültig: Enddatum liegt vor dem Startdatum."
            );
        }
    }

    private byte[] validateAndReadOfferImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Bitte ein Bild hochladen.");
        }
        if (image.getSize() > maxOfferImageSizeBytes) {
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
                throw new IllegalArgumentException("Die Datei ist kein gültiges Bild.");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Die Datei ist kein gültiges Bild.");
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

    private Path offerUploadDirectory() {
        return uploadRoot.resolve(OFFER_UPLOAD_DIRECTORY).normalize();
    }

    private void deleteUploadedOfferImageIfPresent(String imagePath) {
        if (imagePath == null || !imagePath.startsWith(OFFER_UPLOAD_PUBLIC_PREFIX)) {
            return;
        }

        String filename = imagePath.substring(OFFER_UPLOAD_PUBLIC_PREFIX.length());
        if (filename.isBlank()) {
            return;
        }

        Path uploadDirectory = offerUploadDirectory();
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

    private String normalizeBlank(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
