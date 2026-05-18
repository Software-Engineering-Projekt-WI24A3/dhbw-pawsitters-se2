package com.pawsitters.repository;

import com.pawsitters.model.BookingProposal;
import com.pawsitters.model.BookingProposalStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BookingProposalRepository extends JpaRepository<BookingProposal, Long> {

    @Override
    @EntityGraph(attributePaths = {"chat", "chat.offer", "chat.host", "chat.requester", "offer", "sender", "recipient", "petSpecies"})
    Optional<BookingProposal> findById(Long id);

    @EntityGraph(attributePaths = {"chat", "offer", "sender", "recipient", "petSpecies"})
    List<BookingProposal> findByChatIdAndStatus(Long chatId, BookingProposalStatus status);

    @EntityGraph(attributePaths = {"chat", "offer", "sender", "recipient", "petSpecies"})
    List<BookingProposal> findByChatId(Long chatId);

    @EntityGraph(attributePaths = {"chat", "chat.offer", "chat.host", "chat.requester", "offer", "sender", "recipient", "petSpecies"})
    @Query("""
            select proposal from BookingProposal proposal
            where proposal.status = :status
              and (proposal.chat.host.id = :userId or proposal.chat.requester.id = :userId)
            order by proposal.startDate asc, proposal.id asc
            """)
    List<BookingProposal> findByStatusForParticipant(@Param("status") BookingProposalStatus status,
                                                     @Param("userId") Long userId);

    @EntityGraph(attributePaths = {"chat", "chat.offer", "chat.host", "chat.requester", "offer", "sender", "recipient", "petSpecies"})
    @Query("""
            select proposal from BookingProposal proposal
            where proposal.status = :status
              and (proposal.chat.host.id = :userId or proposal.chat.requester.id = :userId)
            order by proposal.endDate desc, proposal.startDate desc, proposal.id desc
            """)
    List<BookingProposal> findByStatusForParticipantOrderByEndDateDesc(@Param("status") BookingProposalStatus status,
                                                                       @Param("userId") Long userId);

    boolean existsByOfferIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long offerId,
            BookingProposalStatus status,
            LocalDate endDate,
            LocalDate startDate
    );
}
