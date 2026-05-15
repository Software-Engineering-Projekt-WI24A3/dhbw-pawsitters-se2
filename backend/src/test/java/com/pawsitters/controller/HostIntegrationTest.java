package com.pawsitters.controller;

import com.pawsitters.model.HostReview;
import com.pawsitters.model.User;
import com.pawsitters.repository.HostReviewRepository;
import com.pawsitters.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HostIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HostReviewRepository hostReviewRepository;

    @Test
    void hostRegistrationCreatesEmptyHostProfileImmediately() throws Exception {
        RegisteredUser host = registerHost("host.empty-profile." + UUID.randomUUID() + "@test.de");

        mockMvc.perform(get("/api/hosts/{id}", host.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Host profile retrieved successfully."))
                .andExpect(jsonPath("$.data.id").value(host.id()))
                .andExpect(jsonPath("$.data.experience").value(""))
                .andExpect(jsonPath("$.data.experiences", hasSize(0)))
                .andExpect(jsonPath("$.data.accommodationDescription").value(""))
                .andExpect(jsonPath("$.data.gallery", hasSize(0)))
                .andExpect(jsonPath("$.data.stats.reviewCount").value(0));
    }

    @Test
    void hostProfileCanBeCreatedReadAndExtendedWithGalleryImage() throws Exception {
        RegisteredUser host = registerHost("host.profile." + UUID.randomUUID() + "@test.de");

        Map<String, Object> payload = new HashMap<>();
        payload.put("bio", "Liebevolle Betreuung in ruhiger Umgebung.");
        payload.put("experience", "Fuenf Jahre Erfahrung mit Hunden und Katzen.");
        payload.put("experiences", List.of("Fuenf Jahre Hundebetreuung", "Katzen-Erste-Hilfe-Kurs"));
        payload.put("accommodationDescription", "Helle Wohnung mit sicherem Balkon und nahegelegenem Park.");
        payload.put("acceptedPetSpecies", List.of("DOG", "CAT"));

        MvcResult createResult = mockMvc.perform(post("/api/hosts")
                        .header("Authorization", "Bearer " + host.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Host profile saved successfully."))
                .andExpect(jsonPath("$.data.id").value(host.id()))
                .andExpect(jsonPath("$.data.experiences", hasSize(2)))
                .andExpect(jsonPath("$.data.gallery", hasSize(0)))
                .andReturn();

        Long hostId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();

        mockMvc.perform(get("/api/hosts/{id}", hostId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(hostId))
                .andExpect(jsonPath("$.data.accommodationDescription").value("Helle Wohnung mit sicherem Balkon und nahegelegenem Park."))
                .andExpect(jsonPath("$.data.acceptedPetSpecies", hasSize(2)));

        MockMultipartFile image = new MockMultipartFile(
                "image",
                "unterkunft.png",
                "image/png",
                createMinimalPng(0x33AA77)
        );

        mockMvc.perform(multipart("/api/hosts/{id}/gallery", hostId)
                        .file(image)
                        .header("Authorization", "Bearer " + host.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Host gallery image uploaded successfully."))
                .andExpect(jsonPath("$.data.id").value(hostId))
                .andExpect(jsonPath("$.data.gallery", hasSize(1)))
                .andExpect(jsonPath("$.data.gallery[0].hostId").value(hostId))
                .andExpect(jsonPath("$.data.gallery[0].imagePath", containsString("/uploads/hosts/" + hostId + "/gallery/")));

        mockMvc.perform(get("/api/hosts/{id}", hostId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.gallery", hasSize(1)))
                .andExpect(jsonPath("$.data.gallery[0].hostId").value(hostId));
    }

    @Test
    void hostStatsReturnAveragesCalculatedFromReviews() throws Exception {
        RegisteredUser hostRegistration = registerHost("host.stats." + UUID.randomUUID() + "@test.de");
        User host = userRepository.findById(hostRegistration.id()).orElseThrow();

        hostReviewRepository.saveAll(List.of(
                buildReview(host, 5, 4, 5, 4, "Sehr zuverlaessig."),
                buildReview(host, 3, 2, 3, 4, "Solide Betreuung.")
        ));

        mockMvc.perform(get("/api/hosts/{id}/stats", host.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Host stats retrieved successfully."))
                .andExpect(jsonPath("$.data.hostId").value(host.getId()))
                .andExpect(jsonPath("$.data.reviewCount").value(2))
                .andExpect(jsonPath("$.data.averageRating").value(4.0))
                .andExpect(jsonPath("$.data.averageCommunicationRating").value(3.0))
                .andExpect(jsonPath("$.data.averageReliabilityRating").value(4.0))
                .andExpect(jsonPath("$.data.averageCareRating").value(4.0));
    }

    @Test
    void petOwnerCannotCreateHostProfile() throws Exception {
        String token = registerPetOwner("owner.host-profile." + UUID.randomUUID() + "@test.de");

        Map<String, Object> payload = new HashMap<>();
        payload.put("experience", "Ich mag Tiere.");
        payload.put("accommodationDescription", "Wohnung.");

        mockMvc.perform(post("/api/hosts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    private RegisteredUser registerHost(String email) throws Exception {
        String token = registerUser(email, "HOST", List.of("DOG", "CAT"));
        Long id = currentUserId(token);
        return new RegisteredUser(token, id);
    }

    private String registerPetOwner(String email) throws Exception {
        return registerUser(email, "PET_OWNER", List.of());
    }

    private String registerUser(String email, String role, List<String> acceptedPetSpecies) throws Exception {
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

        return objectMapper.readTree(response).get("data").get("token").asText();
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

    private HostReview buildReview(User host,
                                   int rating,
                                   int communicationRating,
                                   int reliabilityRating,
                                   int careRating,
                                   String comment) {
        HostReview review = new HostReview();
        review.setHost(host);
        review.setRating(rating);
        review.setCommunicationRating(communicationRating);
        review.setReliabilityRating(reliabilityRating);
        review.setCareRating(careRating);
        review.setComment(comment);
        return review;
    }

    private byte[] createMinimalPng(int rgbColor) throws Exception {
        BufferedImage img = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        img.setRGB(0, 0, rgbColor);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }

    private record RegisteredUser(String token, Long id) {}
}
