package kr.deepsync.wellness.dday;

import kr.deepsync.wellness.dday.repository.SkinGoalRepository;
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
class SkinGoalIntegrationTests {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired SkinGoalRepository skinGoalRepository;
    @Autowired MemberRepository memberRepository;

    @BeforeEach
    void cleanUp() {
        skinGoalRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @Test
    void createsReadsUpdatesAndCompletesGoal() throws Exception {
        String token = signUpAndLogin("user@example.com", "민지");
        LocalDate targetDate = LocalDate.now().plusDays(14);

        String createResponse = mockMvc.perform(post("/api/v1/skin-goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(goalRequest("면접 피부 관리", targetDate, "REDNESS", "면접까지 붉은기 완화")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.daysRemaining").value(14))
                .andExpect(jsonPath("$.data.dayLabel").value("D-14"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andReturn().getResponse().getContentAsString();

        long goalId = objectMapper.readTree(createResponse).get("data").get("goalId").asLong();

        mockMvc.perform(get("/api/v1/skin-goals/active").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.goalId").value(goalId));

        mockMvc.perform(patch("/api/v1/skin-goals/{goalId}", goalId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(goalRequest("촬영 피부 관리", targetDate.plusDays(1), "REDNESS", "붉은기 변화 관찰")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("촬영 피부 관리"))
                .andExpect(jsonPath("$.data.dayLabel").value("D-15"));

        mockMvc.perform(patch("/api/v1/skin-goals/{goalId}/complete", goalId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        mockMvc.perform(get("/api/v1/skin-goals").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status").value("COMPLETED"));
    }

    @Test
    void rejectsSecondActiveGoalAndAllowsNewGoalAfterCancellation() throws Exception {
        String token = signUpAndLogin("user@example.com", "민지");
        LocalDate targetDate = LocalDate.now().plusDays(7);
        long goalId = createGoal(token, targetDate);

        mockMvc.perform(post("/api/v1/skin-goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(goalRequest("두 번째 목표", targetDate.plusDays(1), "REDNESS", null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("ACTIVE_SKIN_GOAL_EXISTS"));

        mockMvc.perform(patch("/api/v1/skin-goals/{goalId}/cancel", goalId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));

        mockMvc.perform(post("/api/v1/skin-goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(goalRequest("새 목표", targetDate.plusDays(1), "REDNESS", null)))
                .andExpect(status().isCreated());
    }

    @Test
    void rejectsUnregisteredConcernAndPastDate() throws Exception {
        String token = signUpAndLogin("user@example.com", "민지");

        mockMvc.perform(post("/api/v1/skin-goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(goalRequest("건조함 목표", LocalDate.now().plusDays(7), "DRYNESS", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("UNREGISTERED_SKIN_CONCERN"));

        mockMvc.perform(post("/api/v1/skin-goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(goalRequest("지난 목표", LocalDate.now().minusDays(1), "REDNESS", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void hidesOtherMembersGoalAndRejectsUnauthenticatedRequest() throws Exception {
        String ownerToken = signUpAndLogin("owner@example.com", "소유자");
        long goalId = createGoal(ownerToken, LocalDate.now().plusDays(7));
        String otherToken = signUpAndLogin("other@example.com", "다른 사용자");

        mockMvc.perform(patch("/api/v1/skin-goals/{goalId}/complete", goalId)
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("SKIN_GOAL_NOT_FOUND"));

        mockMvc.perform(get("/api/v1/skin-goals/active"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void rejectsChangesToFinishedGoal() throws Exception {
        String token = signUpAndLogin("user@example.com", "민지");
        LocalDate targetDate = LocalDate.now().plusDays(7);
        long goalId = createGoal(token, targetDate);

        mockMvc.perform(patch("/api/v1/skin-goals/{goalId}/complete", goalId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/v1/skin-goals/{goalId}", goalId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(goalRequest("수정 시도", targetDate.plusDays(1), "REDNESS", null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("SKIN_GOAL_NOT_ACTIVE"));
    }

    private long createGoal(String token, LocalDate targetDate) throws Exception {
        String response = mockMvc.perform(post("/api/v1/skin-goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(goalRequest("면접 피부 관리", targetDate, "REDNESS", "붉은기 완화")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("data").get("goalId").asLong();
    }

    private String signUpAndLogin(String email, String nickname) throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Password123!","nickname":"%s","skinConcerns":["REDNESS"]}
                                """.formatted(email, nickname)))
                .andExpect(status().isCreated());

        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Password123!"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("data").get("accessToken").asText();
    }

    private String goalRequest(String title, LocalDate targetDate, String concern, String description) {
        String descriptionJson = description == null ? "null" : "\"" + description + "\"";
        return """
                {"title":"%s","targetDate":"%s","targetConcern":"%s","targetDescription":%s}
                """.formatted(title, targetDate, concern, descriptionJson);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
