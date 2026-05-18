package com.pawsitters.service;

import com.pawsitters.dto.HostResponse;
import com.pawsitters.dto.MarketplaceFiltersResponse;
import com.pawsitters.dto.MarketplaceOfferSearchResponse;
import com.pawsitters.dto.OfferResponse;
import com.pawsitters.model.Offer;
import com.pawsitters.model.OfferStatus;
import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.OfferRepository;
import com.pawsitters.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

@Service
public class MarketplaceService {
    private static final int DEFAULT_LATEST_OFFERS_LIMIT = 10;
    private static final int MAX_LATEST_OFFERS_LIMIT = 25;

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

    @Transactional(readOnly = true)
    public List<OfferResponse> getLatestPublishedOffers(Integer limit, Long excludeHostId) {
        int safeLimit = normalizeLatestOfferLimit(limit);
        PageRequest pageRequest = PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "id"));
        Long normalizedExcludeHostId = normalizePositiveId(excludeHostId);

        return (normalizedExcludeHostId == null
                ? offerRepository.findByStatus(OfferStatus.PUBLISHED, pageRequest)
                : offerRepository.findByStatusAndHostIdNot(OfferStatus.PUBLISHED, normalizedExcludeHostId, pageRequest))
                .stream()
                .map(OfferResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MarketplaceOfferSearchResponse searchPublishedOffers(List<PetChoice> speciesFilters,
                                                                String city,
                                                                String postalCode,
                                                                LocalDate availableFrom,
                                                                LocalDate availableTo,
                                                                Integer limit,
                                                                Long excludeHostId) {
        int safeLimit = normalizeLatestOfferLimit(limit);
        Set<PetChoice> normalizedSpeciesFilters = normalizeSpeciesFilters(speciesFilters);
        String normalizedCity = normalizeBlank(city);
        String normalizedPostalCode = normalizePostalCode(postalCode);
        DateRange normalizedDateRange = normalizeDateRange(availableFrom, availableTo);
        Long normalizedExcludeHostId = normalizePositiveId(excludeHostId);

        List<Offer> candidates = offerRepository.findByStatus(OfferStatus.PUBLISHED)
                .stream()
                .filter((offer) -> !isExcludedOffer(offer, normalizedExcludeHostId))
                .filter((offer) -> matchesLocationFilters(offer, normalizedCity, normalizedPostalCode))
                .filter((offer) -> matchesSpeciesFilters(offer, normalizedSpeciesFilters))
                .sorted(Comparator.comparing(Offer::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        if (!normalizedDateRange.hasRange()) {
            List<OfferResponse> matchingOffers = candidates.stream()
                    .limit(safeLimit)
                    .map(OfferResponse::from)
                    .toList();
            return new MarketplaceOfferSearchResponse(matchingOffers, List.of());
        }

        List<OfferResponse> matchingOffers = candidates.stream()
                .filter((offer) -> overlapsDateRange(offer, normalizedDateRange))
                .limit(safeLimit)
                .map(OfferResponse::from)
                .toList();

        List<OfferResponse> alternativeDateOffers = candidates.stream()
                .filter((offer) -> !overlapsDateRange(offer, normalizedDateRange))
                .limit(safeLimit)
                .map(OfferResponse::from)
                .toList();

        return new MarketplaceOfferSearchResponse(matchingOffers, alternativeDateOffers);
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

    private String normalizePostalCode(String value) {
        String normalized = normalizeBlank(value);
        if (normalized == null) {
            return null;
        }

        String digitsOnly = normalized.replaceAll("\\D", "");
        if (digitsOnly.isBlank()) {
            return null;
        }

        return digitsOnly.length() > 5 ? digitsOnly.substring(0, 5) : digitsOnly;
    }

    private int normalizeLatestOfferLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LATEST_OFFERS_LIMIT;
        }

        return Math.max(1, Math.min(MAX_LATEST_OFFERS_LIMIT, limit));
    }

    private Long normalizePositiveId(Long value) {
        if (value == null || value <= 0) {
            return null;
        }

        return value;
    }

    private Set<PetChoice> normalizeSpeciesFilters(List<PetChoice> speciesFilters) {
        if (speciesFilters == null || speciesFilters.isEmpty()) {
            return Set.of();
        }

        return speciesFilters.stream()
                .filter(Objects::nonNull)
                .collect(LinkedHashSet::new, LinkedHashSet::add, LinkedHashSet::addAll);
    }

    private DateRange normalizeDateRange(LocalDate availableFrom, LocalDate availableTo) {
        if (availableFrom == null && availableTo == null) {
            return new DateRange(null, null);
        }

        LocalDate normalizedStart = availableFrom != null ? availableFrom : availableTo;
        LocalDate normalizedEnd = availableTo != null ? availableTo : availableFrom;

        if (normalizedStart != null && normalizedEnd != null && normalizedEnd.isBefore(normalizedStart)) {
            LocalDate previousStart = normalizedStart;
            normalizedStart = normalizedEnd;
            normalizedEnd = previousStart;
        }

        return new DateRange(normalizedStart, normalizedEnd);
    }

    private boolean isExcludedOffer(Offer offer, Long excludeHostId) {
        if (excludeHostId == null || offer == null || offer.getHost() == null || offer.getHost().getId() == null) {
            return false;
        }

        return Objects.equals(offer.getHost().getId(), excludeHostId);
    }

    private boolean matchesSpeciesFilters(Offer offer, Set<PetChoice> speciesFilters) {
        if (speciesFilters == null || speciesFilters.isEmpty()) {
            return true;
        }

        Set<PetChoice> offerSpecies = offer != null ? offer.getAcceptedPetSpecies() : null;
        if (offerSpecies == null || offerSpecies.isEmpty()) {
            return false;
        }

        return offerSpecies.containsAll(speciesFilters);
    }

    private boolean matchesLocationFilters(Offer offer, String city, String postalCode) {
        if (city == null && postalCode == null) {
            return true;
        }

        String normalizedOfferLocation = normalizeBlank(offer != null ? offer.getLocation() : null);
        String normalizedHostCity = normalizeBlank(offer != null && offer.getHost() != null ? offer.getHost().getCity() : null);
        String normalizedHostPostalCode = normalizePostalCode(
                offer != null && offer.getHost() != null ? offer.getHost().getPostalCode() : null
        );

        boolean cityMatches = city == null
                || containsIgnoreCase(normalizedHostCity, city)
                || containsIgnoreCase(normalizedOfferLocation, city);
        boolean postalMatches = postalCode == null
                || Objects.equals(normalizedHostPostalCode, postalCode)
                || containsDigits(normalizedOfferLocation, postalCode);

        return cityMatches && postalMatches;
    }

    private boolean overlapsDateRange(Offer offer, DateRange dateRange) {
        if (dateRange == null || !dateRange.hasRange()) {
            return true;
        }

        LocalDate offerFrom = offer != null ? offer.getAvailableFrom() : null;
        LocalDate offerTo = offer != null ? offer.getAvailableTo() : null;
        if (offerFrom == null || offerTo == null) {
            return true;
        }

        return !offerTo.isBefore(dateRange.start()) && !offerFrom.isAfter(dateRange.end());
    }

    private boolean containsIgnoreCase(String source, String fragment) {
        if (source == null || fragment == null) {
            return false;
        }

        return source.toLowerCase(Locale.ROOT).contains(fragment.toLowerCase(Locale.ROOT));
    }

    private boolean containsDigits(String value, String targetDigits) {
        if (value == null || targetDigits == null) {
            return false;
        }

        String normalizedValue = value.replaceAll("\\D", "");
        return normalizedValue.contains(targetDigits);
    }

    private record DateRange(LocalDate start, LocalDate end) {
        private boolean hasRange() {
            return start != null && end != null;
        }
    }
}
