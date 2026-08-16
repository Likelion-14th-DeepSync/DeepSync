package kr.deepsync.wellness.analysis;

import kr.deepsync.wellness.analysis.domain.SkinAnalysis;
import kr.deepsync.wellness.analysis.dto.request.SkinAnalysisResultRequest;
import kr.deepsync.wellness.analysis.repository.PersonalFactorAnalysisResultRepository;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisBaselineRepository;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisRepository;
import kr.deepsync.wellness.common.domain.DataSourceType;
import kr.deepsync.wellness.environment.repository.EnvironmentRecordRepository;
import kr.deepsync.wellness.image.domain.FaceDirection;
import kr.deepsync.wellness.image.domain.ImageQualityStatus;
import kr.deepsync.wellness.image.domain.SkinImage;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PersonalFactorAnalysisIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PersonalFactorAnalysisResultRepository factorResultRepository;
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
        factorResultRepository.deleteAll();
        baselineRepository.deleteAll();
        analysisRepository.deleteAll();
        qualityRepository.deleteAll();
        imageRepository.deleteAll();
        lifestyleRepository.deleteAll();
        environmentRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @Test
    void connectsPreviousDayRecordsCalculatesStatisticsAndReadsSavedResults() throws Exception {
        String token = signUpAndLogin("factor@example.com");
        Member member = memberRepository.findByEmail("factor@example.com").orElseThrow();
        LocalDate analyzedTo = LocalDate.now().minusDays(1);
        LocalDate analyzedFrom = analyzedTo.minusDays(6);
        int[] rednessScores = {60, 62, 64, 75, 77, 79, 80};

        for (int index = 0; index < 7; index++) {
            LocalDate factorDate = analyzedFrom.plusDays(index);
            int sleepMinutes = index < 3 ? 300 : 450;
            lifestyleRepository.save(LifestyleRecord.create(member, factorDate, sleepMinutes,
                    LocalTime.of(23, 0), LocalTime.of(7, 0), false, 1800, DataSourceType.MANUAL));
            saveAnalysis(member, factorDate.plusDays(1).atTime(8, 0), rednessScores[index], 80);
        }

        mockMvc.perform(post("/api/v1/analysis/factors/recalculate")
                        .param("periodDays", "7")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(9))
                .andExpect(jsonPath("$.data[0].factor").value("SHORT_SLEEP"))
                .andExpect(jsonPath("$.data[0].metrics[0].targetMetric").value("REDNESS"))
                .andExpect(jsonPath("$.data[0].metrics[0].status").value("ANALYZED"))
                .andExpect(jsonPath("$.data[0].metrics[0].exposedCount").value(3))
                .andExpect(jsonPath("$.data[0].metrics[0].normalCount").value(4))
                .andExpect(jsonPath("$.data[0].metrics[0].exposedAverage").value(62.0))
                .andExpect(jsonPath("$.data[0].metrics[0].normalAverage").value(77.8))
                .andExpect(jsonPath("$.data[0].metrics[0].observedDifference").value(-15.8))
                .andExpect(jsonPath("$.data[0].metrics[0].direction").value("NEGATIVE_ASSOCIATION"))
                .andExpect(jsonPath("$.data[0].metrics[0].confidenceLevel").value("MEDIUM"));

        mockMvc.perform(get("/api/v1/analysis/factors/SHORT_SLEEP")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.factor").value("SHORT_SLEEP"))
                .andExpect(jsonPath("$.data.notice").value(
                        "생활·환경 기록과 다음 날 피부 변화 사이의 관찰된 연관성이며 원인을 의미하지 않습니다."));

        mockMvc.perform(get("/api/v1/analysis/factors").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(9));

        mockMvc.perform(post("/api/v1/analysis/factors/recalculate")
                        .param("periodDays", "7")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(9));
    }

    @Test
    void averagesMultipleAnalysesRejectsInvalidPeriodAndIsolatesMembers() throws Exception {
        String ownerToken = signUpAndLogin("factor-owner@example.com");
        String otherToken = signUpAndLogin("factor-other@example.com");
        Member owner = memberRepository.findByEmail("factor-owner@example.com").orElseThrow();
        LocalDate factorDate = LocalDate.now().minusDays(2);
        lifestyleRepository.save(LifestyleRecord.create(owner, factorDate, 300,
                null, null, null, null, DataSourceType.MANUAL));
        saveAnalysis(owner, factorDate.plusDays(1).atTime(8, 0), 60, 80);
        saveAnalysis(owner, factorDate.plusDays(1).atTime(20, 0), 80, 90);

        mockMvc.perform(post("/api/v1/analysis/factors/recalculate")
                .param("periodDays", "7").header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].factor").value("SHORT_SLEEP"))
                .andExpect(jsonPath("$.data[0].metrics[0].exposedAverage").value(70.0));

        mockMvc.perform(post("/api/v1/analysis/factors/recalculate")
                        .param("periodDays", "6").header("Authorization", bearer(ownerToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_FACTOR_ANALYSIS_PERIOD"));

        mockMvc.perform(get("/api/v1/analysis/factors/SHORT_SLEEP")
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("FACTOR_ANALYSIS_NOT_FOUND"));
    }

    private void saveAnalysis(Member member, LocalDateTime capturedAt, int redness, int confidence) {
        SkinImage image = SkinImage.create(member, "factor-test/" + member.getId() + "/" + capturedAt,
                "image/png", 1024, capturedAt, FaceDirection.FRONT, false);
        image.updateQualityStatus(ImageQualityStatus.PASSED);
        imageRepository.save(image);
        SkinAnalysis analysis = SkinAnalysis.request(image);
        analysis.startProcessing();
        analysis.complete(new SkinAnalysisResultRequest(redness, 70, 70, 70, 70,
                confidence, "skin-ai-test"), capturedAt.plusMinutes(1));
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
