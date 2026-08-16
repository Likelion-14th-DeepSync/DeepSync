package kr.deepsync.wellness.experiment;

import kr.deepsync.wellness.experiment.repository.ExperimentDailyCheckRepository;
import kr.deepsync.wellness.experiment.repository.LifestyleExperimentRepository;
import kr.deepsync.wellness.dday.repository.SkinGoalRepository;
import kr.deepsync.wellness.environment.repository.EnvironmentRecordRepository;
import kr.deepsync.wellness.image.repository.SkinImageQualityRepository;
import kr.deepsync.wellness.image.repository.SkinImageRepository;
import kr.deepsync.wellness.lifestyle.repository.LifestyleRecordRepository;
import kr.deepsync.wellness.member.repository.MemberRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class LifestyleExperimentIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired ExperimentDailyCheckRepository checkRepository;
    @Autowired LifestyleExperimentRepository experimentRepository;
    @Autowired LifestyleRecordRepository lifestyleRepository;
    @Autowired EnvironmentRecordRepository environmentRepository;
    @Autowired SkinImageQualityRepository qualityRepository;
    @Autowired SkinImageRepository imageRepository;
    @Autowired SkinGoalRepository skinGoalRepository;
    @Autowired MemberRepository memberRepository;

    @BeforeEach @AfterEach
    void cleanUp() {
        checkRepository.deleteAll();
        experimentRepository.deleteAll();
        lifestyleRepository.deleteAll();
        environmentRepository.deleteAll();
        qualityRepository.deleteAll();
        imageRepository.deleteAll();
        skinGoalRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @Test
    void createsSevenThirtyAndNinetyDayExperimentsWithServerCalculatedEndDates() throws Exception {
        String token = signUpAndLogin("period@example.com");
        LocalDate today = LocalDate.now();
        long sevenId = create(token, "SEVEN_DAYS", today, "7일 수면 실험")
                .andExpect(jsonPath("$.data.durationDays").value(7))
                .andExpect(jsonPath("$.data.endDate").value(today.plusDays(6).toString()))
                .andReturnId(objectMapper);
        cancel(token, sevenId);

        long thirtyId = create(token, "THIRTY_DAYS", today, "30일 수면 실험")
                .andExpect(jsonPath("$.data.durationDays").value(30))
                .andExpect(jsonPath("$.data.endDate").value(today.plusDays(29).toString()))
                .andReturnId(objectMapper);
        cancel(token, thirtyId);

        create(token, "NINETY_DAYS", today, "90일 수면 실험")
                .andExpect(jsonPath("$.data.durationDays").value(90))
                .andExpect(jsonPath("$.data.endDate").value(today.plusDays(89).toString()));
    }

    @Test
    void syncsLifestyleRecordAndCalculatesProgress() throws Exception {
        String token = signUpAndLogin("sync@example.com");
        LocalDate today = LocalDate.now();
        long id = create(token, "SEVEN_DAYS", today, "물 마시기")
                .andReturnId(objectMapper);

        mockMvc.perform(post("/api/v1/lifestyle-records").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content("""
                        {"recordDate":"%s","waterIntakeMl":1800,"sourceType":"MANUAL"}
                        """.formatted(today)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/experiments/{id}/sync", id).header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].achieved").value(true))
                .andExpect(jsonPath("$.data[0].sourceType").value("AUTO"));

        mockMvc.perform(get("/api/v1/experiments/{id}/progress", id).header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentDay").value(1))
                .andExpect(jsonPath("$.data.recordedDays").value(1))
                .andExpect(jsonPath("$.data.completionRate").value(100.0));
    }

    @Test
    void supportsManualChecksAndRejectsInvalidOperations() throws Exception {
        String token = signUpAndLogin("manual@example.com");
        LocalDate today = LocalDate.now();
        long id = create(token, "THIRTY_DAYS", today, "자외선 차단")
                .withType("KEEP_SUNSCREEN_ROUTINE").andReturnId(objectMapper);

        mockMvc.perform(put("/api/v1/experiments/{id}/daily-checks/{date}", id, today)
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"achieved\":true,\"note\":\"외출 전 사용\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.sourceType").value("MANUAL"));
        mockMvc.perform(post("/api/v1/experiments/{id}/sync", id).header("Authorization", bearer(token)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("MANUAL_CHECK_REQUIRED"));
        create(token, "SEVEN_DAYS", today, "중복 실험")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("OPEN_EXPERIMENT_EXISTS"));
        mockMvc.perform(put("/api/v1/experiments/{id}/daily-checks/{date}", id, today.plusDays(1))
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"achieved\":true}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("FUTURE_EXPERIMENT_CHECK"));
    }

    @Test
    void hidesOtherMembersExperiment() throws Exception {
        String owner = signUpAndLogin("owner-exp@example.com");
        String other = signUpAndLogin("other-exp@example.com");
        long id = create(owner, "SEVEN_DAYS", LocalDate.now(), "소유권 테스트").andReturnId(objectMapper);
        mockMvc.perform(get("/api/v1/experiments/{id}", id).header("Authorization", bearer(other)))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.error.code").value("EXPERIMENT_NOT_FOUND"));
    }

    @Test
    void returnsPeriodAwareWeeklyAndMonthlySummaries() throws Exception {
        String token = signUpAndLogin("summary@example.com");
        LocalDate today = LocalDate.now();
        long thirtyId = create(token, "THIRTY_DAYS", today, "30일 요약")
                .withType("KEEP_SUNSCREEN_ROUTINE").andReturnId(objectMapper);
        mockMvc.perform(put("/api/v1/experiments/{id}/daily-checks/{date}", thirtyId, today)
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"achieved\":true}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/experiments/{id}/progress/summary", thirtyId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.overall.elapsedDays").value(1))
                .andExpect(jsonPath("$.data.overall.completionRate").value(100.0))
                .andExpect(jsonPath("$.data.weeklySummaries.length()").value(5))
                .andExpect(jsonPath("$.data.weeklySummaries[4].plannedDays").value(2))
                .andExpect(jsonPath("$.data.monthlySummaries.length()").value(0));
        cancel(token, thirtyId);

        long ninetyId = create(token, "NINETY_DAYS", today, "90일 요약").andReturnId(objectMapper);
        mockMvc.perform(get("/api/v1/experiments/{id}/progress/summary", ninetyId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.weeklySummaries.length()").value(13))
                .andExpect(jsonPath("$.data.weeklySummaries[12].plannedDays").value(6))
                .andExpect(jsonPath("$.data.monthlySummaries.length()").value(3))
                .andExpect(jsonPath("$.data.monthlySummaries[0].plannedDays").value(30));
    }

    @Test
    void automaticallySyncsWhenLifestyleRecordIsCreatedUpdatedOrCleared() throws Exception {
        String token = signUpAndLogin("auto-sync@example.com");
        LocalDate today = LocalDate.now();
        long id = create(token, "SEVEN_DAYS", today, "자동 물 섭취 실험").andReturnId(objectMapper);

        mockMvc.perform(post("/api/v1/lifestyle-records").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(lifestyleBody(today, 1800)))
                .andExpect(status().isCreated());
        expectProgress(token, id, 1, 1, 100.0);

        mockMvc.perform(patch("/api/v1/lifestyle-records/{date}", today)
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content(lifestyleBody(today, 1000)))
                .andExpect(status().isOk());
        expectProgress(token, id, 1, 0, 0.0);

        mockMvc.perform(patch("/api/v1/lifestyle-records/{date}", today)
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content(lifestyleBody(today, null)))
                .andExpect(status().isOk());
        expectProgress(token, id, 0, 0, 0.0);

        mockMvc.perform(put("/api/v1/experiments/{id}/daily-checks/{date}", id, today)
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"achieved\":true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("MANUAL_CHECK_NOT_ALLOWED"));
    }

    private void expectProgress(String token, long id, int recorded, int achieved, double rate) throws Exception {
        mockMvc.perform(get("/api/v1/experiments/{id}/progress", id).header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recordedDays").value(recorded))
                .andExpect(jsonPath("$.data.achievedDays").value(achieved))
                .andExpect(jsonPath("$.data.completionRate").value(rate));
    }

    private String lifestyleBody(LocalDate date, Integer water) {
        return """
                {"recordDate":"%s","waterIntakeMl":%s,"sourceType":"MANUAL"}
                """.formatted(date, water == null ? "null" : water);
    }

    private CreateResult create(String token, String period, LocalDate startDate, String title) {
        return new CreateResult(token, period, startDate, title, "WATER_AT_LEAST_1500_ML");
    }

    private void cancel(String token, long id) throws Exception {
        mockMvc.perform(patch("/api/v1/experiments/{id}/cancel", id).header("Authorization", bearer(token)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    private class CreateResult {
        private final String token, period, title;
        private final LocalDate date;
        private String type;
        private org.springframework.test.web.servlet.ResultActions result;
        CreateResult(String token, String period, LocalDate date, String title, String type) {
            this.token=token; this.period=period; this.date=date; this.title=title; this.type=type;
        }
        CreateResult withType(String type) { this.type=type; return this; }
        CreateResult andExpect(org.springframework.test.web.servlet.ResultMatcher matcher) throws Exception {
            ensure(); result.andExpect(matcher); return this;
        }
        long andReturnId(ObjectMapper mapper) throws Exception {
            ensure(); result.andExpect(status().isCreated());
            return mapper.readTree(result.andReturn().getResponse().getContentAsString()).get("data").get("experimentId").asLong();
        }
        private void ensure() throws Exception {
            if(result==null) result=mockMvc.perform(post("/api/v1/experiments").header("Authorization",bearer(token))
                    .contentType(MediaType.APPLICATION_JSON).content("""
                    {"title":"%s","experimentType":"%s","experimentPeriod":"%s","startDate":"%s"}
                    """.formatted(title,type,period,date)));
        }
    }

    private String signUpAndLogin(String email) throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content("""
                {"email":"%s","password":"Password123!","nickname":"테스터","skinConcerns":["REDNESS"]}
                """.formatted(email))).andExpect(status().isCreated());
        String response=mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                {"email":"%s","password":"Password123!"}
                """.formatted(email))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("data").get("accessToken").asText();
    }
    private String bearer(String token){return "Bearer "+token;}
}
