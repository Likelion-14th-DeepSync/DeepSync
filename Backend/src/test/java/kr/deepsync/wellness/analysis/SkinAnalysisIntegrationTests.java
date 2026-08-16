package kr.deepsync.wellness.analysis;

import kr.deepsync.wellness.analysis.repository.SkinAnalysisRepository;
import kr.deepsync.wellness.image.domain.FaceDirection;
import kr.deepsync.wellness.image.domain.ImageQualityStatus;
import kr.deepsync.wellness.image.domain.SkinImage;
import kr.deepsync.wellness.image.repository.SkinImageRepository;
import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SkinAnalysisIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired SkinAnalysisRepository analysisRepository;
    @Autowired SkinImageRepository imageRepository;
    @Autowired MemberRepository memberRepository;

    @BeforeEach
    void cleanUp() {
        analysisRepository.deleteAll();
        imageRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        cleanUp();
    }

    @Test
    void managesAnalysisLifecycleAndQueriesCompletedResult() throws Exception {
        String token = signUpAndLogin("analysis@example.com");
        Long imageId = saveImage("analysis@example.com", ImageQualityStatus.PASSED,
                LocalDateTime.now().minusDays(1));

        String requested = mockMvc.perform(post("/api/v1/skin-images/{imageId}/analyses", imageId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn().getResponse().getContentAsString();
        long analysisId = objectMapper.readTree(requested).get("data").get("analysisId").asLong();

        mockMvc.perform(patch("/api/v1/skin-analyses/{analysisId}/start", analysisId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PROCESSING"));

        mockMvc.perform(patch("/api/v1/skin-analyses/{analysisId}/result", analysisId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rednessScore": 82,
                                  "troubleScore": 75,
                                  "drynessScore": 68,
                                  "toneUniformityScore": 79,
                                  "overallScore": 77,
                                  "confidenceScore": 86,
                                  "modelVersion": "skin-ai-v1"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.overallScore").value(77))
                .andExpect(jsonPath("$.data.modelVersion").value("skin-ai-v1"));

        mockMvc.perform(get("/api/v1/skin-analyses/latest").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysisId").value(analysisId));

        LocalDate capturedDate = LocalDate.now().minusDays(1);
        mockMvc.perform(get("/api/v1/skin-analyses")
                        .param("startDate", capturedDate.toString())
                        .param("endDate", capturedDate.toString())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));

        mockMvc.perform(get("/api/v1/skin-images/{imageId}/analysis", imageId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysisId").value(analysisId));
    }

    @Test
    void rejectsUncheckedOrRejectedImageAndInvalidScores() throws Exception {
        String token = signUpAndLogin("validation@example.com");
        Long pendingImageId = saveImage("validation@example.com", ImageQualityStatus.PENDING,
                LocalDateTime.now().minusHours(2));
        Long rejectedImageId = saveImage("validation@example.com", ImageQualityStatus.REJECTED,
                LocalDateTime.now().minusHours(1));

        mockMvc.perform(post("/api/v1/skin-images/{imageId}/analyses", pendingImageId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("IMAGE_QUALITY_CHECK_REQUIRED"));

        mockMvc.perform(post("/api/v1/skin-images/{imageId}/analyses", rejectedImageId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("IMAGE_QUALITY_NOT_ACCEPTED"));

        Long passedImageId = saveImage("validation@example.com", ImageQualityStatus.PASSED,
                LocalDateTime.now().minusMinutes(30));
        String requested = mockMvc.perform(post("/api/v1/skin-images/{imageId}/analyses", passedImageId)
                        .header("Authorization", bearer(token)))
                .andReturn().getResponse().getContentAsString();
        long analysisId = objectMapper.readTree(requested).get("data").get("analysisId").asLong();
        mockMvc.perform(patch("/api/v1/skin-analyses/{analysisId}/start", analysisId)
                .header("Authorization", bearer(token))).andExpect(status().isOk());

        mockMvc.perform(patch("/api/v1/skin-analyses/{analysisId}/result", analysisId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rednessScore":101,"troubleScore":75,"drynessScore":68,
                                 "toneUniformityScore":79,"overallScore":77,"confidenceScore":86,
                                 "modelVersion":"skin-ai-v1"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void isolatesAnalysisByMemberAndSupportsFailureRetry() throws Exception {
        String ownerToken = signUpAndLogin("owner-analysis@example.com");
        String otherToken = signUpAndLogin("other-analysis@example.com");
        Long imageId = saveImage("owner-analysis@example.com", ImageQualityStatus.PASSED,
                LocalDateTime.now().minusMinutes(10));
        String requested = mockMvc.perform(post("/api/v1/skin-images/{imageId}/analyses", imageId)
                        .header("Authorization", bearer(ownerToken)))
                .andReturn().getResponse().getContentAsString();
        long analysisId = objectMapper.readTree(requested).get("data").get("analysisId").asLong();

        mockMvc.perform(get("/api/v1/skin-analyses/{analysisId}", analysisId)
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch("/api/v1/skin-analyses/{analysisId}/start", analysisId)
                .header("Authorization", bearer(ownerToken))).andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/skin-analyses/{analysisId}/failure", analysisId)
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"AI 서버 응답 시간 초과\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("FAILED"));

        mockMvc.perform(post("/api/v1/skin-images/{imageId}/analyses", imageId)
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.failureReason").isEmpty());
    }

    private Long saveImage(String email, ImageQualityStatus status, LocalDateTime capturedAt) {
        Member member = memberRepository.findByEmail(email).orElseThrow();
        SkinImage image = SkinImage.create(member, "test/" + email + "/" + capturedAt,
                "image/png", 1024, capturedAt, FaceDirection.FRONT, false);
        image.updateQualityStatus(status);
        return imageRepository.save(image).getId();
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
