package kr.deepsync.wellness.record;

import kr.deepsync.wellness.environment.repository.EnvironmentRecordRepository;
import kr.deepsync.wellness.dday.repository.SkinGoalRepository;
import kr.deepsync.wellness.lifestyle.repository.LifestyleRecordRepository;
import kr.deepsync.wellness.member.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DailyRecordIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired LifestyleRecordRepository lifestyleRepository;
    @Autowired EnvironmentRecordRepository environmentRepository;
    @Autowired SkinGoalRepository skinGoalRepository;
    @Autowired MemberRepository memberRepository;

    @BeforeEach
    void cleanUp() {
        lifestyleRepository.deleteAll();
        environmentRepository.deleteAll();
        skinGoalRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @Test
    void createsReadsAndUpdatesLifestyleRecord() throws Exception {
        String token = signUpAndLogin("user@example.com");
        LocalDate yesterday = LocalDate.now().minusDays(1);

        mockMvc.perform(post("/api/v1/lifestyle-records")
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content(lifestyleBody(yesterday, 420, 1500)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.sleepDurationMinutes").value(420));

        mockMvc.perform(get("/api/v1/lifestyle-records/{date}", yesterday)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recordDate").value(yesterday.toString()));

        mockMvc.perform(patch("/api/v1/lifestyle-records/{date}", yesterday)
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content(lifestyleBody(yesterday, 480, 1800)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sleepDurationMinutes").value(480))
                .andExpect(jsonPath("$.data.waterIntakeMl").value(1800));
    }

    @Test
    void createsPartialEnvironmentRecordAndQueriesRange() throws Exception {
        String token = signUpAndLogin("user@example.com");
        LocalDate start = LocalDate.now().minusDays(2);
        LocalDate end = LocalDate.now().minusDays(1);

        createEnvironment(token, start, """
                {"recordDate":"%s","uvIndex":7.2,"temperature":31.5,"humidity":72,"fineDust":28,"sourceType":"MANUAL"}
                """.formatted(start));
        createEnvironment(token, end, """
                {"recordDate":"%s","uvIndex":null,"temperature":null,"humidity":55,"fineDust":null,"sourceType":"WEATHER_API"}
                """.formatted(end));

        mockMvc.perform(get("/api/v1/environment-records")
                        .param("startDate", start.toString()).param("endDate", end.toString())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[1].humidity").value(55))
                .andExpect(jsonPath("$.data[1].sourceType").value("WEATHER_API"));
    }

    @Test
    void rejectsDuplicatesFutureDatesInvalidValuesAndRanges() throws Exception {
        String token = signUpAndLogin("user@example.com");
        LocalDate today = LocalDate.now();
        LocalDate future = today.plusDays(1);

        mockMvc.perform(post("/api/v1/lifestyle-records")
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content(lifestyleBody(today, 420, 1500)))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/lifestyle-records")
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content(lifestyleBody(today, 420, 1500)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("DUPLICATE_LIFESTYLE_RECORD"));

        mockMvc.perform(post("/api/v1/environment-records")
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"recordDate":"%s","uvIndex":21,"humidity":101,"sourceType":"MANUAL"}
                                """.formatted(future)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));

        mockMvc.perform(get("/api/v1/lifestyle-records")
                        .param("startDate", today.toString()).param("endDate", today.minusDays(1).toString())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_DATE_RANGE"));
    }

    @Test
    void isolatesMembersRecordsAndRequiresAuthentication() throws Exception {
        String ownerToken = signUpAndLogin("owner@example.com");
        String otherToken = signUpAndLogin("other@example.com");
        LocalDate date = LocalDate.now();

        mockMvc.perform(post("/api/v1/lifestyle-records")
                        .header("Authorization", bearer(ownerToken)).contentType(MediaType.APPLICATION_JSON)
                        .content(lifestyleBody(date, null, null)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/lifestyle-records/{date}", date)
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("LIFESTYLE_RECORD_NOT_FOUND"));

        mockMvc.perform(get("/api/v1/environment-records/{date}", date))
                .andExpect(status().isUnauthorized());
    }

    private void createEnvironment(String token, LocalDate date, String body) throws Exception {
        mockMvc.perform(post("/api/v1/environment-records")
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.recordDate").value(date.toString()));
    }

    private String lifestyleBody(LocalDate date, Integer sleep, Integer water) {
        return """
                {"recordDate":"%s","sleepDurationMinutes":%s,"bedtime":"00:10","wakeUpTime":"07:10",
                 "lateNightMeal":false,"waterIntakeMl":%s,"sourceType":"MANUAL"}
                """.formatted(date, sleep == null ? "null" : sleep, water == null ? "null" : water);
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
