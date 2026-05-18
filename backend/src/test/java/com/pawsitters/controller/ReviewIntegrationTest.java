package com.pawsitters.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReviewIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void completedBookingCanBeReviewedAndAffectsHostProfileStats() throws Exception {
        BookingFixture booking = createAcceptedBooking();

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + booking.petOwnerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildReviewPayload(booking.bookingId(), 5))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        completeBooking(booking.petOwnerToken(), booking.bookingId());

        Map<String, Object> reviewPayload = buildReviewPayload(booking.bookingId(), 5);
        reviewPayload.put("communicationRating", 4);
        reviewPayload.put("reliabilityRating", 5);
        reviewPayload.put("careRating", 5);
        reviewPayload.put("comment", "Sehr liebevolle Betreuung mit guten Updates.");

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + booking.hostToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewPayload)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + booking.petOwnerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Review created successfully."))
                .andExpect(jsonPath("$.data.bookingId").value(booking.bookingId()))
                .andExpect(jsonPath("$.data.hostId").value(booking.hostId()))
                .andExpect(jsonPath("$.data.petOwnerId").value(booking.petOwnerId()))
                .andExpect(jsonPath("$.data.rating").value(5))
                .andExpect(jsonPath("$.data.communicationRating").value(4))
                .andExpect(jsonPath("$.data.comment").value("Sehr liebevolle Betreuung mit guten Updates."));

        mockMvc.perform(get("/api/hosts/{id}/reviews", booking.hostId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Host reviews retrieved successfully."))
                .andExpect(jsonPath("$.meta.total").value(1))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].bookingId").value(booking.bookingId()))
                .andExpect(jsonPath("$.data[0].rating").value(5));

        mockMvc.perform(get("/api/hosts/{id}", booking.hostId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.reviewCount").value(1))
                .andExpect(jsonPath("$.data.stats.averageRating").value(5.0))
                .andExpect(jsonPath("$.data.stats.averageCommunicationRating").value(4.0))
                .andExpect(jsonPath("$.data.stats.averageReliabilityRating").value(5.0))
                .andExpect(jsonPath("$.data.stats.averageCareRating").value(5.0));

        mockMvc.perform(get("/api/marketplace/hosts")
                        .header("Authorization", "Bearer " + booking.petOwnerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == " + booking.hostId() + ")].rating", hasItem(5.0)))
                .andExpect(jsonPath("$.data[?(@.id == " + booking.hostId() + ")].numberOfRatings", hasItem(1)));

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + booking.petOwnerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewPayload)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    void reviewRatingMustBeBetweenOneAndFive() throws Exception {
        BookingFixture booking = createAcceptedBooking();
        completeBooking(booking.petOwnerToken(), booking.bookingId());

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + booking.petOwnerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildReviewPayload(booking.bookingId(), 6))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    private BookingFixture createAcceptedBooking() throws Exception {
        RegisteredUser host = registerUser("review.host." + UUID.randomUUID() + "@test.de", "HOST", List.of("DOG"));
        RegisteredUser petOwner = registerUser("review.owner." + UUID.randomUUID() + "@test.de", "PET_OWNER", List.of());
        LocalDate startDate = LocalDate.now().plusMonths(1).plusDays(10);
        LocalDate endDate = startDate.plusDays(1);

        Long offerId = createPublishedOffer(host.token(), startDate.minusDays(1), endDate.plusDays(1));
        Long chatId = createChat(petOwner.token(), offerId);
        Long bookingId = createBookingProposal(petOwner.token(), chatId, startDate, endDate);

        mockMvc.perform(patch("/api/booking-proposals/{id}/accept", bookingId)
                        .header("Authorization", "Bearer " + host.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));

        return new BookingFixture(host.token(), host.id(), petOwner.token(), petOwner.id(), bookingId);
    }

    private RegisteredUser registerUser(String email, String role, List<String> acceptedPetSpecies) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("password", "StrongPhrase123!");
        payload.put("firstName", "Max");
        payload.put("lastName", "Muster");
        payload.put("phone", "0123456789");
        payload.put("birthDate", LocalDate.of(2000, 1, 1).toString());
        payload.put("emergencyContact", "Notfallkontakt");
        payload.put("profilePicture", "max.png");
        payload.put("bio", "Test user");
        payload.put("role", role);
        payload.put("postalCode", "70173");
        payload.put("city", "Stuttgart");
        payload.put("acceptedPetSpecies", acceptedPetSpecies);

        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(response).get("data").get("token").asText();
        return new RegisteredUser(token, currentUserId(token));
    }

    private Long currentUserId(String token) throws Exception {
        String response = mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("data").get("id").asLong();
    }

    private Long createPublishedOffer(String hostToken, LocalDate availableFrom, LocalDate availableTo) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/offers")
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildOfferPayload(availableFrom, availableTo))))
                .andExpect(status().isOk())
                .andReturn();

        Long offerId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();

        mockMvc.perform(patch("/api/offers/{id}/publish", offerId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk());

        return offerId;
    }

    private Long createChat(String requesterToken, Long offerId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/chats")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("offerId", offerId))))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();
    }

    private Long createBookingProposal(String token, Long chatId, LocalDate startDate, LocalDate endDate) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/chats/{id}/booking-proposals", chatId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBookingProposalPayload(startDate, endDate))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
        return data.get("id").asLong();
    }

    private void completeBooking(String token, Long bookingId) throws Exception {
        mockMvc.perform(patch("/api/bookings/{id}/complete", bookingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }

    private Map<String, Object> buildOfferPayload(LocalDate availableFrom, LocalDate availableTo) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "Review Testangebot " + UUID.randomUUID());
        payload.put("description", "Betreuung mit Updates und persoenlicher Abstimmung.");
        payload.put("pricePerDay", BigDecimal.valueOf(42.50));
        payload.put("availableFrom", availableFrom.toString());
        payload.put("availableTo", availableTo.toString());
        payload.put("acceptedPetSpecies", List.of("DOG"));
        payload.put("services", List.of("Fuetterung", "Spaziergang"));
        return payload;
    }

    private Map<String, Object> buildBookingProposalPayload(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("startDate", startDate.toString());
        payload.put("endDate", endDate.toString());
        payload.put("priceTotal", BigDecimal.valueOf(120.00));
        payload.put("petSpecies", List.of("DOG"));
        payload.put("petCount", 1);
        payload.put("note", "Bitte mit taeglichen Updates.");
        return payload;
    }

    private Map<String, Object> buildReviewPayload(Long bookingId, int rating) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("bookingId", bookingId);
        payload.put("rating", rating);
        payload.put("comment", "Danke fuer die Betreuung.");
        return payload;
    }

    private record RegisteredUser(String token, Long id) {}

    private record BookingFixture(String hostToken,
                                  Long hostId,
                                  String petOwnerToken,
                                  Long petOwnerId,
                                  Long bookingId) {}
}
