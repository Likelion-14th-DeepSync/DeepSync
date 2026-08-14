package kr.deepsync.wellness.image;

import kr.deepsync.wellness.image.repository.SkinImageRepository;
import kr.deepsync.wellness.member.repository.MemberRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "storage.skin-image.directory=build/test-uploads/skin-images")
@AutoConfigureMockMvc
class SkinImageIntegrationTests {
    private static final byte[] VALID_PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired SkinImageRepository skinImageRepository;
    @Autowired MemberRepository memberRepository;

    @BeforeEach
    void cleanUp() {
        skinImageRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        skinImageRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @Test
    void uploadsReadsListsDownloadsAndDeletesImage() throws Exception {
        String token = signUpAndLogin("owner@example.com");
        LocalDateTime capturedAt = LocalDateTime.now().minusMinutes(10).withNano(0);

        String response = upload(token, VALID_PNG, capturedAt, "FRONT", false)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.contentType").value("image/png"))
                .andExpect(jsonPath("$.data.direction").value("FRONT"))
                .andExpect(jsonPath("$.data.qualityStatus").value("PENDING"))
                .andReturn().getResponse().getContentAsString();
        long imageId = objectMapper.readTree(response).get("data").get("imageId").asLong();

        mockMvc.perform(get("/api/v1/skin-images/{imageId}", imageId).header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.imageId").value(imageId));

        LocalDate date = capturedAt.toLocalDate();
        mockMvc.perform(get("/api/v1/skin-images")
                        .param("startDate", date.toString()).param("endDate", date.toString())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));

        mockMvc.perform(get("/api/v1/skin-images/{imageId}/file", imageId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(VALID_PNG));

        mockMvc.perform(delete("/api/v1/skin-images/{imageId}", imageId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/skin-images/{imageId}", imageId).header("Authorization", bearer(token)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("SKIN_IMAGE_NOT_FOUND"));
    }

    @Test
    void rejectsUnsupportedFilesAndFutureCaptureTime() throws Exception {
        String token = signUpAndLogin("owner@example.com");

        upload(token, "not-an-image".getBytes(), LocalDateTime.now().minusMinutes(1), "FRONT", false)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("UNSUPPORTED_IMAGE_FORMAT"));

        upload(token, VALID_PNG, LocalDateTime.now().plusDays(1), "LEFT", true)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("FUTURE_CAPTURED_AT"));
    }

    @Test
    void isolatesImagesByMemberAndRequiresAuthentication() throws Exception {
        String ownerToken = signUpAndLogin("owner@example.com");
        String otherToken = signUpAndLogin("other@example.com");
        String response = upload(ownerToken, VALID_PNG, LocalDateTime.now().minusMinutes(1), "RIGHT", false)
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long imageId = objectMapper.readTree(response).get("data").get("imageId").asLong();

        mockMvc.perform(get("/api/v1/skin-images/{imageId}", imageId)
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("SKIN_IMAGE_NOT_FOUND"));
        mockMvc.perform(get("/api/v1/skin-images/{imageId}", imageId))
                .andExpect(status().isUnauthorized());
    }

    private org.springframework.test.web.servlet.ResultActions upload(
            String token, byte[] content, LocalDateTime capturedAt, String direction, boolean makeupApplied)
            throws Exception {
        MockMultipartFile image = new MockMultipartFile("image", "skin.png", "image/png", content);
        MockMultipartFile metadata = new MockMultipartFile("metadata", "", "application/json", """
                {"capturedAt":"%s","direction":"%s","makeupApplied":%s}
                """.formatted(capturedAt.withNano(0), direction, makeupApplied).getBytes());
        return mockMvc.perform(multipart("/api/v1/skin-images")
                .file(image).file(metadata).header("Authorization", bearer(token)));
    }

    private String signUpAndLogin(String email) throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content("""
                {"email":"%s","password":"Password123!","nickname":"테스터","skinConcerns":["REDNESS"]}
                """.formatted(email))).andExpect(status().isCreated());
        String response = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                {"email":"%s","password":"Password123!"}
                """.formatted(email))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("data").get("accessToken").asText();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
