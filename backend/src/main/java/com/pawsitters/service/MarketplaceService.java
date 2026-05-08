package com.pawsitters.service;

import com.pawsitters.dto.HostResponse;
import com.pawsitters.dto.MarketplaceFiltersResponse;
import com.pawsitters.dto.OfferResponse;
import com.pawsitters.model.Offer;
import com.pawsitters.model.OfferStatus;
import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.OfferRepository;
import com.pawsitters.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class MarketplaceService {

    private final UserRepository userRepository;
    private final OfferRepository offerRepository;

    public MarketplaceService(UserRepository userRepository, OfferRepository offerRepository) {
        this.userRepository = userRepository;
        this.offerRepository = offerRepository;
    }

    @Transactional(readOnly = true)
    public List<HostResponse> getHosts() {
        return userRepository.findByRole(UserRole.HOST)
                .stream()
                .sorted(hostComparator())
                .map(HostResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HostResponse> searchHosts(PetChoice species, String postalCode) {
        return userRepository.searchHosts(species, normalizeBlank(postalCode))
                .stream()
                .sorted(hostComparator())
                .map(HostResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MarketplaceFiltersResponse getFilters() {
        List<User> hosts = userRepository.findByRole(UserRole.HOST);

        List<PetChoice> species = hosts.stream()
                .flatMap(host -> host.getAcceptedPetSpecies().stream())
                .distinct()
                .sorted(Comparator.comparing(Enum::name))
                .toList();

        List<String> postalCodes = hosts.stream()
                .map(User::getPostalCode)
                .map(this::normalizeBlank)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();

        List<String> cities = hosts.stream()
                .map(User::getCity)
                .map(this::normalizeBlank)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();

        return new MarketplaceFiltersResponse(species, postalCodes, cities);
    }

    @Transactional(readOnly = true)
    public List<OfferResponse> getPublishedOffers() {
        return offerRepository.findByStatus(OfferStatus.PUBLISHED)
                .stream()
                .sorted(Comparator
                        .comparing(Offer::getTitle, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(Offer::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(OfferResponse::from)
                .toList();
    }

    private Comparator<User> hostComparator() {
        return Comparator
                .comparing(User::getRating, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(User::getNumberOfRatings, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(User::getLastName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                .thenComparing(User::getFirstName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
    }

    private String normalizeBlank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
