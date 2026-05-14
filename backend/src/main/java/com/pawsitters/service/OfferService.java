package com.pawsitters.service;

import com.pawsitters.model.Offer;
import com.pawsitters.model.OfferStatus;
import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.OfferRepository;
import com.pawsitters.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class OfferService {

    private final OfferRepository offerRepository;
    private final UserRepository userRepository;

    public OfferService(OfferRepository offerRepository, UserRepository userRepository) {
        this.offerRepository = offerRepository;
        this.userRepository = userRepository;
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

        if (availableTo.isBefore(availableFrom)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Der Zeitraum ist ungültig: Enddatum liegt vor dem Startdatum."
            );
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
