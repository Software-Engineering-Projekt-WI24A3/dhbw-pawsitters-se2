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
                                         String description,
                                         BigDecimal pricePerDay,
                                         Set<PetChoice> acceptedPetSpecies,
                                         List<String> services) {
        User host = getHostByEmail(hostEmail);

        Offer offer = new Offer();
        offer.setHost(host);
        offer.setTitle(title.trim());
        offer.setDescription(description.trim());
        offer.setPricePerDay(pricePerDay);
        offer.setAcceptedPetSpecies(new LinkedHashSet<>(acceptedPetSpecies));
        offer.setServices(services.stream().map(String::trim).toList());
        offer.setStatus(OfferStatus.DRAFT);

        return offerRepository.save(offer);
    }

    @Transactional
    public Offer publishOfferForHostEmail(Long offerId, String hostEmail) {
        Offer offer = getOwnedOffer(offerId, hostEmail);
        offer.setStatus(OfferStatus.PUBLISHED);
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

    private User getHostByEmail(String hostEmail) {
        User user = getUserByEmail(hostEmail);
        if (user.getRole() != UserRole.HOST) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nur Gastgeber koennen Angebote erstellen.");
        }
        return user;
    }

    private User getUserByEmail(String userEmail) {
        return userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User nicht gefunden."));
    }
}
