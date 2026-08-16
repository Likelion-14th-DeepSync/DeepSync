package kr.deepsync.wellness.analysis;

import kr.deepsync.wellness.analysis.domain.SkinAnalysis;
import kr.deepsync.wellness.analysis.dto.request.SkinAnalysisResultRequest;
import kr.deepsync.wellness.analysis.repository.AnalysisConfidenceResultRepository;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisBaselineRepository;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisRepository;
import kr.deepsync.wellness.common.domain.DataSourceType;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.environment.repository.EnvironmentRecordRepository;
import kr.deepsync.wellness.image.domain.*;
import kr.deepsync.wellness.image.repository.SkinImageQualityRepository;
import kr.deepsync.wellness.image.repository.SkinImageRepository;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import kr.deepsync.wellness.lifestyle.repository.LifestyleRecordRepository;
import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.repository.MemberRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AnalysisConfidenceIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired AnalysisConfidenceResultRepository confidenceRepository;
    @Autowired SkinAnalysisBaselineRepository baselineRepository;
    @Autowired SkinAnalysisRepository analysisRepository;
    @Autowired SkinImageQualityRepository qualityRepository;
    @Autowired SkinImageRepository imageRepository;
    @Autowired LifestyleRecordRepository lifestyleRepository;
    @Autowired EnvironmentRecordRepository environmentRepository;
    @Autowired MemberRepository memberRepository;

    @BeforeEach
    @AfterEach
    void cleanUp() {
        confidenceRepository.deleteAll();
        baselineRepository.deleteAll();
        analysisRepository.deleteAll();
        qualityRepository.deleteAll();
        imageRepository.deleteAll();
        lifestyleRepository.deleteAll();
        environmentRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @Test
    void calculatesPersistsAndUpdatesWeightedConfidenceWithCaps() throws Exception {
        String token = signUpAndLogin("confidence@example.com");
        Member member = memberRepository.findByEmail("confidence@example.com").orElseThrow();
        LocalDate today = LocalDate.now();
        for (int index = 0; index < 7; index++) {
            LocalDate date = today.minusDays(index);
            saveSkinEvidence(member, date.atTime(8, 0));
            lifestyleRepository.save(LifestyleRecord.create(member, date, 430,
                    LocalTime.of(23, 0), LocalTime.of(7, 0), false, 1800, DataSourceType.MANUAL));
            environmentRepository.save(EnvironmentRecord.create(member, date, BigDecimal.valueOf(3),
                    BigDecimal.valueOf(22), 50, 30, DataSourceType.MANUAL));
        }

        mockMvc.perform(post("/api/v1/analysis/confidence/recalculate")
                        .param("periodDays", "7").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.score").value(79))
                .andExpect(jsonPath("$.data.level").value("MEDIUM"))
                .andExpect(jsonPath("$.data.periodDays").value(7))
                .andExpect(jsonPath("$.data.components.imageQuality.score").value(80))
                .andExpect(jsonPath("$.data.components.imageQuality.available").value(true))
                .andExpect(jsonPath("$.data.components.skinRecordCoverage.score").value(100))
                .andExpect(jsonPath("$.data.components.lifestyleCompleteness.score").value(100))
                .andExpect(jsonPath("$.data.components.environmentCompleteness.score").value(100))
                .andExpect(jsonPath("$.data.components.repeatedObservations.available").value(false))
                .andExpect(jsonPath("$.data.components.experimentEvidence.available").value(false))
                .andExpect(jsonPath("$.data.components.modelConfidence.score").value(80));

        mockMvc.perform(get("/api/v1/analysis/confidence").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.score").value(79));

        mockMvc.perform(post("/api/v1/analysis/confidence/recalculate")
                        .param("periodDays", "7").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.score").value(79));
        org.assertj.core.api.Assertions.assertThat(confidenceRepository.count()).isEqualTo(1);
    }

    @Test
    void validatesPeriodReturnsLowForMissingDataAndIsolatesMembers() throws Exception {
        String owner = signUpAndLogin("confidence-owner@example.com");
        String other = signUpAndLogin("confidence-other@example.com");

        mockMvc.perform(post("/api/v1/analysis/confidence/recalculate")
                        .param("periodDays", "7").header("Authorization", bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.score").value(0))
                .andExpect(jsonPath("$.data.level").value("LOW"));

        mockMvc.perform(get("/api/v1/analysis/confidence").header("Authorization", bearer(other)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("ANALYSIS_CONFIDENCE_NOT_FOUND"));

        mockMvc.perform(post("/api/v1/analysis/confidence/recalculate")
                        .param("periodDays", "91").header("Authorization", bearer(owner)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_CONFIDENCE_ANALYSIS_PERIOD"));
    }

    private void saveSkinEvidence(Member member, LocalDateTime capturedAt) {
        SkinImage image = SkinImage.create(member, "confidence-test/" + member.getId() + "/" + capturedAt,
                "image/png", 1024, capturedAt, FaceDirection.FRONT, false);
        image.updateQualityStatus(ImageQualityStatus.PASSED);
        imageRepository.save(image);
        QualityAnalysis qualityAnalysis = new QualityAnalysis(80, 80, 80, 80, 80,
                ImageQualityStatus.PASSED, List.of(), "quality-test");
        qualityRepository.save(SkinImageQuality.create(image, qualityAnalysis, capturedAt.plusMinutes(1)));
        SkinAnalysis analysis = SkinAnalysis.request(image);
        analysis.startProcessing();
        analysis.complete(new SkinAnalysisResultRequest(75, 75, 75, 75, 75,
                80, "skin-ai-test"), capturedAt.plusMinutes(2));
        analysisRepository.save(analysis);
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
