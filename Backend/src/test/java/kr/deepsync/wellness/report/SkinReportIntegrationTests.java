package kr.deepsync.wellness.report;

import kr.deepsync.wellness.analysis.domain.*;
import kr.deepsync.wellness.analysis.dto.request.SkinAnalysisResultRequest;
import kr.deepsync.wellness.analysis.repository.*;
import kr.deepsync.wellness.common.domain.DataSourceType;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.environment.repository.EnvironmentRecordRepository;
import kr.deepsync.wellness.experiment.domain.*;
import kr.deepsync.wellness.experiment.repository.*;
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

import java.math.BigDecimal;
import java.time.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SkinReportIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired AnalysisConfidenceResultRepository confidenceRepository;
    @Autowired PersonalFactorAnalysisResultRepository factorRepository;
    @Autowired SkinAnalysisBaselineRepository baselineRepository;
    @Autowired SkinAnalysisRepository analysisRepository;
    @Autowired LifestyleExperimentResultRepository experimentResultRepository;
    @Autowired ExperimentDailyCheckRepository checkRepository;
    @Autowired LifestyleExperimentRepository experimentRepository;
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
        lifestyleRepository.deleteAll();
        environmentRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @Test
    void aggregatesWeeklyScoresRecordsFactorsExperimentAndConfidence() throws Exception {
        String token = signUpAndLogin("report@example.com");
        Member member = memberRepository.findByEmail("report@example.com").orElseThrow();
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        saveAnalysis(member, monday.minusDays(2).atTime(8, 0), 60, 60);
        saveAnalysis(member, monday.atTime(8, 0), 70, 70);
        saveAnalysis(member, monday.atTime(20, 0), 80, 80);
        saveAnalysis(member, today.atTime(8, 0), 85, 85);
        lifestyleRepository.save(LifestyleRecord.create(member, monday, 420, LocalTime.of(23, 0),
                LocalTime.of(6, 0), false, 1800, DataSourceType.MANUAL));
        lifestyleRepository.save(LifestyleRecord.create(member, today, 480, LocalTime.of(0, 30),
                LocalTime.of(8, 0), true, 1200, DataSourceType.MANUAL));
        environmentRepository.save(EnvironmentRecord.create(member, monday, BigDecimal.valueOf(7),
                BigDecimal.valueOf(31), 35, 90, DataSourceType.MANUAL));
        environmentRepository.save(EnvironmentRecord.create(member, today, BigDecimal.valueOf(3),
                BigDecimal.valueOf(25), 50, 30, DataSourceType.MANUAL));
        LifestyleExperiment experiment = experimentRepository.save(LifestyleExperiment.create(member,
                "수면 실험", ExperimentType.SLEEP_AT_LEAST_7_HOURS, ExperimentPeriod.SEVEN_DAYS, monday, monday));
        checkRepository.save(ExperimentDailyCheck.create(experiment, monday, true, "420분",
                CheckSourceType.AUTO, null));
        factorRepository.save(PersonalFactorAnalysisResult.create(member, FactorType.SHORT_SLEEP,
                TargetSkinMetric.REDNESS, new FactorAnalysisCalculation(FactorAnalysisStatus.ANALYZED,
                        65.0, 72.0, -7.0, 5, 6, 2, 85, AnalysisConfidenceLevel.MEDIUM,
                        AssociationDirection.NEGATIVE_ASSOCIATION, "짧은 수면 다음 날 붉은기 점수가 낮게 관찰됐습니다.",
                        today.minusDays(30), today.minusDays(1), LocalDateTime.now())));
        mockMvc.perform(post("/api/v1/analysis/confidence/recalculate")
                        .param("periodDays", "7").header("Authorization", bearer(token)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/reports/weekly").param("date", today.toString())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reportType").value("WEEKLY"))
                .andExpect(jsonPath("$.data.displayPeriod.startDate").value(monday.toString()))
                .andExpect(jsonPath("$.data.calculatedPeriod.endDate").value(today.toString()))
                .andExpect(jsonPath("$.data.skin.analysisCount").value(3))
                .andExpect(jsonPath("$.data.skin.recordedDays").value(2))
                .andExpect(jsonPath("$.data.skin.averages.overall").value(80.0))
                .andExpect(jsonPath("$.data.skin.previousAverages.overall").value(60.0))
                .andExpect(jsonPath("$.data.skin.changes.overall").value(20.0))
                .andExpect(jsonPath("$.data.skin.mostImprovedMetric.metric").value("REDNESS"))
                .andExpect(jsonPath("$.data.lifestyle.averageSleepMinutes").value(450.0))
                .andExpect(jsonPath("$.data.lifestyle.bedtimeBeforeMidnightDays").value(1))
                .andExpect(jsonPath("$.data.environment.averageUvIndex").value(5.0))
                .andExpect(jsonPath("$.data.environment.riskDays.highUvDays").value(1))
                .andExpect(jsonPath("$.data.topObservedFactors[0].factor").value("SHORT_SLEEP"))
                .andExpect(jsonPath("$.data.activeExperiment.experiment.experimentId").value(experiment.getId()))
                .andExpect(jsonPath("$.data.confidence").isNotEmpty());
    }

    @Test
    void supportsMonthlyPartialReportsValidatesFutureAndIsolatesMembers() throws Exception {
        String ownerToken = signUpAndLogin("report-owner@example.com");
        String otherToken = signUpAndLogin("report-other@example.com");
        Member owner = memberRepository.findByEmail("report-owner@example.com").orElseThrow();
        LocalDate today = LocalDate.now();
        saveAnalysis(owner, today.atTime(8, 0), 75, 75);

        mockMvc.perform(get("/api/v1/reports/monthly")
                        .param("year", String.valueOf(today.getYear()))
                        .param("month", String.valueOf(today.getMonthValue()))
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reportType").value("MONTHLY"))
                .andExpect(jsonPath("$.data.displayPeriod.startDate").value(today.withDayOfMonth(1).toString()))
                .andExpect(jsonPath("$.data.calculatedPeriod.endDate").value(today.toString()))
                .andExpect(jsonPath("$.data.skin.recordedDays").value(1));

        mockMvc.perform(get("/api/v1/reports/monthly")
                        .param("year", String.valueOf(today.getYear()))
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_MONTHLY_REPORT_PERIOD"));

        YearMonth future = YearMonth.from(today).plusMonths(1);
        mockMvc.perform(get("/api/v1/reports/monthly")
                        .param("year", String.valueOf(future.getYear()))
                        .param("month", String.valueOf(future.getMonthValue()))
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("FUTURE_REPORT_PERIOD"));

        mockMvc.perform(get("/api/v1/reports/weekly")
                        .param("date", today.plusDays(1).toString())
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("FUTURE_REPORT_PERIOD"));

        mockMvc.perform(get("/api/v1/reports/monthly").header("Authorization", bearer(otherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.skin.recordedDays").value(0));
    }

    private void saveAnalysis(Member member, LocalDateTime capturedAt, int redness, int overall) {
        SkinImage image = SkinImage.create(member, "report-test/" + member.getId() + "/" + capturedAt,
                "image/png", 1024, capturedAt, FaceDirection.FRONT, false);
        image.updateQualityStatus(ImageQualityStatus.PASSED);
        imageRepository.save(image);
        SkinAnalysis analysis = SkinAnalysis.request(image);
        analysis.startProcessing();
        analysis.complete(new SkinAnalysisResultRequest(redness, 70, 70, 70, overall,
                85, "skin-ai-test"), capturedAt.plusMinutes(1));
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
