package com.pawsitters.service;

import com.pawsitters.dto.HostReviewResponse;
import com.pawsitters.exception.ForbiddenException;
import com.pawsitters.exception.NotFoundException;
import com.pawsitters.model.BookingProposal;
import com.pawsitters.model.BookingProposalStatus;
import com.pawsitters.model.HostReview;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.BookingProposalRepository;
import com.pawsitters.repository.HostReviewRepository;
import com.pawsitters.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class ReviewService {

    private final HostReviewRepository hostReviewRepository;
    private final BookingProposalRepository bookingProposalRepository;
    private final UserRepository userRepository;

    public ReviewService(HostReviewRepository hostReviewRepository,
                         BookingProposalRepository bookingProposalRepository,
                         UserRepository userRepository) {
        this.hostReviewRepository = hostReviewRepository;
        this.bookingProposalRepository = bookingProposalRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public HostReviewResponse createReview(String actorEmail,
                                           Long bookingId,
                                           Integer rating,
                                           Integer communicationRating,
                                           Integer reliabilityRating,
                                           Integer careRating,
                                           String comment) {
        BookingProposal booking = bookingProposalRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Buchung nicht gefunden."));
        User actor = getUserByEmail(actorEmail);

        assertPetOwnerCanReview(booking, actor);
        if (booking.getStatus() != BookingProposalStatus.COMPLETED) {
            throw new IllegalArgumentException("Bewertungen sind erst nach Abschluss einer Buchung moeglich.");
        }
        if (hostReviewRepository.existsByBookingId(booking.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Diese Buchung wurde bereits bewertet.");
        }

        User host = booking.getChat().getHost();
        HostReview review = new HostReview();
        review.setBooking(booking);
        review.setHost(host);
        review.setPetOwner(actor);
        review.setRating(rating);
        review.setCommunicationRating(resolveRating(communicationRating, rating));
        review.setReliabilityRating(resolveRating(reliabilityRating, rating));
        review.setCareRating(resolveRating(careRating, rating));
        review.setComment(normalizeComment(comment));

        HostReview savedReview = hostReviewRepository.save(review);
        recalculateHostRating(host);
        return HostReviewResponse.from(savedReview);
    }

    @Transactional(readOnly = true)
    public List<HostReviewResponse> getReviewsForHost(Long hostId) {
        User host = userRepository.findById(hostId)
                .orElseThrow(() -> new NotFoundException("Host nicht gefunden."));
        if (host.getRole() != UserRole.HOST) {
            throw new NotFoundException("Host nicht gefunden.");
        }

        return hostReviewRepository.findByHostIdOrderByCreatedAtDescIdDesc(hostId).stream()
                .map(HostReviewResponse::from)
                .toList();
    }

    private void assertPetOwnerCanReview(BookingProposal booking, User actor) {
        User requester = booking.getChat().getRequester();
        if (requester == null || actor == null || !requester.getId().equals(actor.getId())) {
            throw new ForbiddenException("Nur der Tierhalter dieser Buchung darf den Host bewerten.");
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new NotFoundException("User nicht gefunden."));
    }

    private Integer resolveRating(Integer detailedRating, Integer fallbackRating) {
        return detailedRating == null ? fallbackRating : detailedRating;
    }

    private String normalizeComment(String rawComment) {
        if (rawComment == null) {
            return null;
        }
        String comment = rawComment.trim();
        return comment.isEmpty() ? null : comment;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private void recalculateHostRating(User host) {
        HostReviewRepository.HostReviewStatsProjection stats =
                hostReviewRepository.calculateStatsByHostId(host.getId());
        long reviewCount = stats == null || stats.getReviewCount() == null ? 0L : stats.getReviewCount();
        double averageRating = stats == null || stats.getAverageRating() == null ? 0.0 : stats.getAverageRating();

        host.setNumberOfRatings(Math.toIntExact(reviewCount));
        host.setRating((float) averageRating);
        userRepository.save(host);
    }
}
