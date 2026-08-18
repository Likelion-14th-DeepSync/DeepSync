package kr.deepsync.wellness.dashboard;

import kr.deepsync.wellness.analysis.domain.SkinAnalysis;
import kr.deepsync.wellness.analysis.domain.SkinAnalysisBaseline;
import kr.deepsync.wellness.analysis.dto.request.SkinAnalysisResultRequest;
import kr.deepsync.wellness.analysis.repository.*;
import kr.deepsync.wellness.common.domain.DataSourceType;
import kr.deepsync.wellness.dday.domain.SkinGoal;
import kr.deepsync.wellness.dday.repository.SkinGoalRepository;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.environment.repository.EnvironmentRecordRepository;
import kr.deepsync.wellness.experiment.domain.*;
import kr.deepsync.wellness.experiment.repository.*;
import kr.deepsync.wellness.image.domain.FaceDirection;
import kr.deepsync.wellness.image.domain.ImageQualityStatus;
import kr.deepsync.wellness.image.domain.SkinImage;
import kr.deepsync.wellness.image.repository.SkinImageQualityRepository;
import kr.deepsync.wellness.image.repository.SkinImageRepository;
import kr.deepsync.wellness.lifestyle.repository.LifestyleRecordRepository;
import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.domain.SkinConcern;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DdayDashboardIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired AnalysisConfidenceResultRepository confidenceRepository;
    @Autowired PersonalFactorAnalysisResultRepository factorRepository;
    @Autowired SkinAnalysisBaselineRepository baselineRepository;
    @Autowired SkinAnalysisRepository analysisRepository;
    @Autowired LifestyleExperimentResultRepository experimentResultRepository;
    @Autowired ExperimentDailyCheckRepository checkRepository;
    @Autowired LifestyleExperimentRepository experimentRepository;
    @Autowired SkinGoalRepository goalRepository;
    @Autowired SkinImageQualityRepository qualityRepository;
    @Autowired SkinImageRepository imageRepository;
    @Autowired LifestyleRecordRepository lifestyleRepository;
    @Autowired EnvironmentRecordRepository environmentRepository;
    @Autowired MemberRepository memberRepository;

    @BeforeEach
    @AfterEach
    void cleanUp() {
        confidenceRepository.deleteAll();
        factorRepository.deleteAll();
        baselineRepository.deleteAll();
        experimentResultRepository.deleteAll();
        checkRepository.deleteAll();
        experimentRepository.deleteAll();
        analysisRepository.deleteAll();
        qualityRepository.deleteAll();
        imageRepository.deleteAll();
        goalRepository.deleteAll();
        lifestyleRepository.deleteAll();
        environmentRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @Test
    void combinesGoalSkinExperimentEnvironmentTimelineAndConfidence() throws Exception {
        String token = signUpAndLogin("dashboard@example.com");
        Member member = memberRepository.findByEmail("dashboard@example.com").orElseThrow();
        LocalDate today = LocalDate.now();
        goalRepository.save(SkinGoal.create(member, "면접까지 붉은기 완화", today.plusDays(14),
                SkinConcern.REDNESS, "붉은기 점수 개선"));
        LifestyleExperiment experiment = experimentRepository.save(LifestyleExperiment.create(member,
                "7시간 수면", ExperimentType.SLEEP_AT_LEAST_7_HOURS, ExperimentPeriod.SEVEN_DAYS, today, today));
        checkRepository.save(ExperimentDailyCheck.create(experiment, today, true, "420분",
                CheckSourceType.AUTO, null));
        environmentRepository.save(EnvironmentRecord.create(member, today, BigDecimal.valueOf(7),
                BigDecimal.valueOf(31), 35, 90, DataSourceType.MANUAL));
        SkinAnalysis baseline = saveAnalysis(member, today.minusDays(1).atTime(8, 0), 70, 70);
        saveAnalysis(member, today.atTime(8, 0), 75, 76);
        baselineRepository.save(SkinAnalysisBaseline.create(member, baseline, LocalDateTime.now()));
        mockMvc.perform(post("/api/v1/analysis/confidence/recalculate")
                        .param("periodDays", "7").header("Authorization", bearer(token)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/dashboard/dday").param("period", "SEVEN_DAYS")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.goal.title").value("면접까지 붉은기 완화"))
                .andExpect(jsonPath("$.data.goal.daysRemaining").value(14))
                .andExpect(jsonPath("$.data.skinInsight.today.overallScore").value(76))
                .andExpect(jsonPath("$.data.skinInsight.changes.baseline.overallScoreChange").value(6))
                .andExpect(jsonPath("$.data.activeExperiment.experiment.experimentId").value(experiment.getId()))
                .andExpect(jsonPath("$.data.activeExperiment.progress.completionRate").value(100.0))
                .andExpect(jsonPath("$.data.environment.available").value(true))
                .andExpect(jsonPath("$.data.environment.risks.length()").value(4))
                .andExpect(jsonPath("$.data.timeline.period").value("SEVEN_DAYS"))
                .andExpect(jsonPath("$.data.timeline.analysisCount").value(2))
                .andExpect(jsonPath("$.data.confidence").isNotEmpty())
                .andExpect(jsonPath("$.data.routine.status").value("NOT_CONNECTED"));
    }

    @Test
    void returnsPartialDashboardWithWarningsAndProtectsMemberData() throws Exception {
        String emptyToken = signUpAndLogin("empty-dashboard@example.com");
        String ownerToken = signUpAndLogin("dashboard-owner@example.com");
        Member owner = memberRepository.findByEmail("dashboard-owner@example.com").orElseThrow();
        goalRepository.save(SkinGoal.create(owner, "소유자 목표", LocalDate.now().plusDays(10),
                SkinConcern.REDNESS, null));

        mockMvc.perform(get("/api/v1/dashboard/dday").header("Authorization", bearer(emptyToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.goal").doesNotExist())
                .andExpect(jsonPath("$.data.skinInsight").doesNotExist())
                .andExpect(jsonPath("$.data.activeExperiment").doesNotExist())
                .andExpect(jsonPath("$.data.environment.available").value(false))
                .andExpect(jsonPath("$.data.timeline.analysisCount").value(0))
                .andExpect(jsonPath("$.data.confidence").doesNotExist())
                .andExpect(jsonPath("$.data.warnings.length()").value(5))
                .andExpect(jsonPath("$.data.routine.available").value(false));

        mockMvc.perform(get("/api/v1/dashboard/dday"))
                .andExpect(status().isUnauthorized());
    }

    private SkinAnalysis saveAnalysis(Member member, LocalDateTime capturedAt, int redness, int overall) {
        SkinImage image = SkinImage.create(member, "dashboard-test/" + member.getId() + "/" + capturedAt,
                "image/png", 1024, capturedAt, FaceDirection.FRONT, false);
        image.updateQualityStatus(ImageQualityStatus.PASSED);
        imageRepository.save(image);
        SkinAnalysis analysis = SkinAnalysis.request(image);
        analysis.startProcessing();
        analysis.complete(new SkinAnalysisResultRequest(redness, 75, 75, 75, overall,
                85, "skin-ai-test"), capturedAt.plusMinutes(1));
        return analysisRepository.save(analysis);
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
