package kr.deepsync.wellness.experiment;

import kr.deepsync.wellness.analysis.domain.SkinAnalysis;
import kr.deepsync.wellness.analysis.dto.request.SkinAnalysisResultRequest;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisBaselineRepository;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisRepository;
import kr.deepsync.wellness.experiment.domain.*;
import kr.deepsync.wellness.experiment.repository.ExperimentDailyCheckRepository;
import kr.deepsync.wellness.experiment.repository.LifestyleExperimentRepository;
import kr.deepsync.wellness.experiment.repository.LifestyleExperimentResultRepository;
import kr.deepsync.wellness.image.domain.FaceDirection;
import kr.deepsync.wellness.image.domain.ImageQualityStatus;
import kr.deepsync.wellness.image.domain.SkinImage;
import kr.deepsync.wellness.image.repository.SkinImageQualityRepository;
import kr.deepsync.wellness.image.repository.SkinImageRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LifestyleExperimentResultIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired LifestyleExperimentResultRepository resultRepository;
    @Autowired ExperimentDailyCheckRepository checkRepository;
    @Autowired LifestyleExperimentRepository experimentRepository;
    @Autowired SkinAnalysisBaselineRepository baselineRepository;
    @Autowired SkinAnalysisRepository analysisRepository;
    @Autowired SkinImageQualityRepository qualityRepository;
    @Autowired SkinImageRepository imageRepository;
    @Autowired MemberRepository memberRepository;

    @BeforeEach
    @AfterEach
    void cleanUp() {
        resultRepository.deleteAll();
        checkRepository.deleteAll();
        experimentRepository.deleteAll();
        baselineRepository.deleteAll();
        analysisRepository.deleteAll();
        qualityRepository.deleteAll();
        imageRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @Test
    void calculatesStoresReadsAndRecalculatesCompletedExperimentResult() throws Exception {
        String token = signUpAndLogin("experiment-result@example.com");
        Member member = memberRepository.findByEmail("experiment-result@example.com").orElseThrow();
        LocalDate startDate = LocalDate.now().minusDays(8);
        LifestyleExperiment experiment = completedExperiment(member, startDate);

        for (int day = 0; day < 6; day++) {
            checkRepository.save(ExperimentDailyCheck.create(experiment, startDate.plusDays(day), day < 5,
                    null, CheckSourceType.MANUAL, null));
        }
        saveAnalysis(member, startDate.minusDays(3).atTime(9, 0), 60, 65, 70, 70, 64, 90);
        saveAnalysis(member, startDate.minusDays(2).atTime(9, 0), 65, 66, 71, 72, 65, 90);
        saveAnalysis(member, startDate.minusDays(1).atTime(9, 0), 70, 67, 72, 74, 66, 90);
        saveAnalysis(member, startDate.plusDays(4).atTime(9, 0), 75, 69, 74, 76, 73, 90);
        saveAnalysis(member, startDate.plusDays(5).atTime(9, 0), 80, 70, 75, 78, 75, 90);
        saveAnalysis(member, startDate.plusDays(6).atTime(9, 0), 85, 71, 76, 80, 77, 90);

        mockMvc.perform(post("/api/v1/experiments/{id}/result", experiment.getId())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.achievementRate").value(83.3))
                .andExpect(jsonPath("$.data.evaluatedDays").value(6))
                .andExpect(jsonPath("$.data.achievedDays").value(5))
                .andExpect(jsonPath("$.data.missingDays").value(1))
                .andExpect(jsonPath("$.data.beforeAnalysisCount").value(3))
                .andExpect(jsonPath("$.data.afterAnalysisCount").value(3))
                .andExpect(jsonPath("$.data.scoreChanges.redness.before").value(65.0))
                .andExpect(jsonPath("$.data.scoreChanges.redness.after").value(80.0))
                .andExpect(jsonPath("$.data.scoreChanges.redness.change").value(15.0))
                .andExpect(jsonPath("$.data.scoreChanges.overall.change").value(10.0))
                .andExpect(jsonPath("$.data.mostChangedMetric").value("REDNESS"))
                .andExpect(jsonPath("$.data.changeDirection").value("IMPROVED"))
                .andExpect(jsonPath("$.data.confidenceLevel").value("HIGH"))
                .andExpect(jsonPath("$.data.recommendation").value("CONTINUE"));

        mockMvc.perform(get("/api/v1/experiments/{id}/result", experiment.getId())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.experimentId").value(experiment.getId()));

        mockMvc.perform(post("/api/v1/experiments/{id}/result", experiment.getId())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EXPERIMENT_RESULT_EXISTS"));

        mockMvc.perform(put("/api/v1/experiments/{id}/result", experiment.getId())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recommendation").value("CONTINUE"));
    }

    @Test
    void requiresCompletedExperimentAndEnoughSkinAnalysesAndProtectsOwnership() throws Exception {
        String ownerToken = signUpAndLogin("result-owner@example.com");
        String otherToken = signUpAndLogin("result-other@example.com");
        Member owner = memberRepository.findByEmail("result-owner@example.com").orElseThrow();
        LocalDate today = LocalDate.now();
        LifestyleExperiment active = experimentRepository.save(LifestyleExperiment.create(owner, "진행 중",
                ExperimentType.WATER_AT_LEAST_1500_ML, ExperimentPeriod.SEVEN_DAYS, today, today));

        mockMvc.perform(post("/api/v1/experiments/{id}/result", active.getId())
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EXPERIMENT_RESULT_REQUIRES_COMPLETION"));

        active.complete(active.getEndDate(), LocalDateTime.now());
        experimentRepository.save(active);
        mockMvc.perform(post("/api/v1/experiments/{id}/result", active.getId())
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("EXPERIMENT_ANALYSIS_DATA_INSUFFICIENT"));

        mockMvc.perform(get("/api/v1/experiments/{id}/result", active.getId())
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("EXPERIMENT_NOT_FOUND"));
    }

    private LifestyleExperiment completedExperiment(Member member, LocalDate startDate) {
        LifestyleExperiment experiment = LifestyleExperiment.create(member, "7일 수면 실험",
                ExperimentType.SLEEP_AT_LEAST_7_HOURS, ExperimentPeriod.SEVEN_DAYS, startDate, startDate);
        experiment.complete(experiment.getEndDate(), experiment.getEndDate().atTime(23, 0));
        return experimentRepository.save(experiment);
    }

    private void saveAnalysis(Member member, LocalDateTime capturedAt, int redness, int trouble,
                              int dryness, int tone, int overall, int confidence) {
        SkinImage image = SkinImage.create(member, "result-test/" + capturedAt, "image/png", 1024,
                capturedAt, FaceDirection.FRONT, false);
        image.updateQualityStatus(ImageQualityStatus.PASSED);
        imageRepository.save(image);
        SkinAnalysis analysis = SkinAnalysis.request(image);
        analysis.startProcessing();
        analysis.complete(new SkinAnalysisResultRequest(redness, trouble, dryness, tone, overall,
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
