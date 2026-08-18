package kr.deepsync.wellness.analysis;

import kr.deepsync.wellness.analysis.domain.*;
import kr.deepsync.wellness.analysis.dto.request.SkinAnalysisResultRequest;
import kr.deepsync.wellness.analysis.repository.*;
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
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DailySkinInsightIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired AnalysisConfidenceResultRepository confidenceRepository;
    @Autowired PersonalFactorAnalysisResultRepository factorRepository;
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
        factorRepository.deleteAll();
        baselineRepository.deleteAll();
        analysisRepository.deleteAll();
        qualityRepository.deleteAll();
        imageRepository.deleteAll();
        lifestyleRepository.deleteAll();
        environmentRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @Test
    void selectsRepresentativeComparesScoresAndExplainsObservedFactor() throws Exception {
        String token = signUpAndLogin("insight@example.com");
        Member member = memberRepository.findByEmail("insight@example.com").orElseThrow();
        LocalDate today = LocalDate.now();
        SkinAnalysis previous = saveAnalysis(member, today.minusDays(1).atTime(8, 0),
                70, 72, 74, 76, 70, 85);
        SkinAnalysis representative = saveAnalysis(member, today.atTime(0, 20),
                64, 72, 72, 77, 66, 95);
        saveAnalysis(member, today.atTime(0, 30), 80, 80, 80, 80, 80, 70);
        baselineRepository.save(SkinAnalysisBaseline.create(member, previous, LocalDateTime.now()));
        lifestyleRepository.save(LifestyleRecord.create(member, today.minusDays(1), 300,
                LocalTime.of(0, 30), LocalTime.of(7, 0), false, 1200, DataSourceType.MANUAL));
        factorRepository.save(PersonalFactorAnalysisResult.create(member, FactorType.SHORT_SLEEP,
                TargetSkinMetric.REDNESS, new FactorAnalysisCalculation(FactorAnalysisStatus.ANALYZED,
                        65.0, 71.0, -6.0, 5, 6, 2, 85.0, AnalysisConfidenceLevel.MEDIUM,
                        AssociationDirection.NEGATIVE_ASSOCIATION,
                        "수면 6시간 미만 조건의 다음 날 붉은기 점수가 비교 기록보다 평균 6.0점 낮게 관찰됐습니다.",
                        today.minusDays(30), today.minusDays(1), LocalDateTime.now())));
        mockMvc.perform(post("/api/v1/analysis/confidence/recalculate")
                        .param("periodDays", "7").header("Authorization", bearer(token)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/analysis/today").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.today.analysisId").value(representative.getId()))
                .andExpect(jsonPath("$.data.today.modelConfidenceScore").value(95))
                .andExpect(jsonPath("$.data.changes.previous.overallScoreChange").value(-4))
                .andExpect(jsonPath("$.data.changes.baseline.overallScoreChange").value(-4))
                .andExpect(jsonPath("$.data.changes.largestChange.metric").value("REDNESS"))
                .andExpect(jsonPath("$.data.changes.largestChange.amount").value(-6))
                .andExpect(jsonPath("$.data.changes.largestChange.direction").value("WORSENED"))
                .andExpect(jsonPath("$.data.associatedFactors.length()").value(1))
                .andExpect(jsonPath("$.data.associatedFactors[0].factor").value("SHORT_SLEEP"))
                .andExpect(jsonPath("$.data.confidence").isNotEmpty())
                .andExpect(jsonPath("$.data.dataUsage.usedData.length()").value(2))
                .andExpect(jsonPath("$.data.dataUsage.excludedData[0].type").value("ENVIRONMENT_RECORD"))
                .andExpect(jsonPath("$.data.summary").value(org.hamcrest.Matchers.containsString("4점 낮습니다")))
                .andExpect(jsonPath("$.data.notice").value(
                        "개인 기록에서 관찰된 변화에 대한 설명이며 의학적 진단이나 원인 판정이 아닙니다."));
    }

    @Test
    void supportsSpecificDateWarningsFutureValidationAndMemberIsolation() throws Exception {
        String owner = signUpAndLogin("insight-owner@example.com");
        String other = signUpAndLogin("insight-other@example.com");
        Member member = memberRepository.findByEmail("insight-owner@example.com").orElseThrow();
        LocalDate date = LocalDate.now().minusDays(2);
        saveAnalysis(member, date.atTime(8, 0), 70, 70, 70, 70, 70, 80);

        mockMvc.perform(get("/api/v1/analysis/daily").param("date", date.toString())
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysisDate").value(date.toString()))
                .andExpect(jsonPath("$.data.changes.baseline").doesNotExist())
                .andExpect(jsonPath("$.data.changes.previous").doesNotExist())
                .andExpect(jsonPath("$.data.confidence").doesNotExist())
                .andExpect(jsonPath("$.data.warnings.length()").value(3));

        mockMvc.perform(get("/api/v1/analysis/daily")
                        .param("date", LocalDate.now().plusDays(1).toString())
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("FUTURE_INSIGHT_DATE"));

        mockMvc.perform(get("/api/v1/analysis/daily").param("date", date.toString())
                        .header("Authorization", bearer(other)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("DAILY_SKIN_ANALYSIS_NOT_FOUND"));
    }

    private SkinAnalysis saveAnalysis(Member member, LocalDateTime capturedAt, int redness, int trouble,
                                      int dryness, int tone, int overall, int confidence) {
        SkinImage image = SkinImage.create(member, "insight-test/" + member.getId() + "/" + capturedAt,
                "image/png", 1024, capturedAt, FaceDirection.FRONT, false);
        image.updateQualityStatus(ImageQualityStatus.PASSED);
        imageRepository.save(image);
        SkinAnalysis analysis = SkinAnalysis.request(image);
        analysis.startProcessing();
        analysis.complete(new SkinAnalysisResultRequest(redness, trouble, dryness, tone, overall,
                confidence, "skin-ai-test"), capturedAt.plusMinutes(1));
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
