package com.pawsitters.dto;

import com.pawsitters.model.BookingProposal;
import com.pawsitters.model.BookingProposalDeclineReason;
import com.pawsitters.model.BookingProposalStatus;
import com.pawsitters.model.PetChoice;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

public record BookingProposalResponse(
        Long id,
        Long chatId,
        Long offerId,
        String offerTitle,
        Long senderId,
        String senderFirstName,
        String senderLastName,
        Long recipientId,
        String recipientFirstName,
        String recipientLastName,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal priceTotal,
        String currency,
        Set<PetChoice> petSpecies,
        Integer petCount,
        String note,
        BookingProposalStatus status,
        BookingProposalDeclineReason declineReason,
        Instant createdAt,
        Instant respondedAt
) {
    public static BookingProposalResponse from(BookingProposal proposal) {
        return new BookingProposalResponse(
                proposal.getId(),
                proposal.getChat().getId(),
                proposal.getOffer().getId(),
                proposal.getOffer().getTitle(),
                proposal.getSender().getId(),
                proposal.getSender().getFirstName(),
                proposal.getSender().getLastName(),
                proposal.getRecipient().getId(),
                proposal.getRecipient().getFirstName(),
                proposal.getRecipient().getLastName(),
                proposal.getStartDate(),
                proposal.getEndDate(),
                proposal.getPriceTotal(),
                proposal.getCurrency(),
                proposal.getPetSpecies(),
                proposal.getPetCount(),
                proposal.getNote(),
                proposal.getStatus(),
                proposal.getDeclineReason(),
                proposal.getCreatedAt(),
                proposal.getRespondedAt()
        );
    }
}
