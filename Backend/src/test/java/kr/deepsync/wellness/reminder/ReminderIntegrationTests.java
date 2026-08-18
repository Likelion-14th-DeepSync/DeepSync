package kr.deepsync.wellness.reminder;

import kr.deepsync.wellness.common.domain.DataSourceType;
import kr.deepsync.wellness.image.domain.FaceDirection;
import kr.deepsync.wellness.image.domain.ImageQualityStatus;
import kr.deepsync.wellness.image.domain.SkinImage;
import kr.deepsync.wellness.image.repository.SkinImageRepository;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import kr.deepsync.wellness.lifestyle.repository.LifestyleRecordRepository;
import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.repository.MemberRepository;
import kr.deepsync.wellness.reminder.repository.ReminderSettingRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReminderIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired ReminderSettingRepository settingRepository;
    @Autowired SkinImageRepository imageRepository;
    @Autowired LifestyleRecordRepository lifestyleRepository;
    @Autowired MemberRepository memberRepository;

    @BeforeEach
    @AfterEach
    void cleanUp() {
        settingRepository.deleteAll();
        imageRepository.deleteAll();
        lifestyleRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @Test
    void createsUpdatesDisablesDeletesAndValidatesReminderSettings() throws Exception {
        String token = signUpAndLogin("reminder-setting@example.com");
        DayOfWeek today = ZonedDateTime.now(ZoneId.of("Asia/Seoul")).getDayOfWeek();

        putSetting(token, "SKIN_CAPTURE", true, "21:00", today, "Asia/Seoul")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reminderType").value("SKIN_CAPTURE"))
                .andExpect(jsonPath("$.data.enabled").value(true));
        putSetting(token, "SKIN_CAPTURE", true, "20:30", today, "Asia/Seoul")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reminderTime").value("20:30:00"));

        mockMvc.perform(get("/api/v1/reminders/settings").header("Authorization", bearer(token)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1));
        org.assertj.core.api.Assertions.assertThat(settingRepository.count()).isEqualTo(1);

        mockMvc.perform(patch("/api/v1/reminders/settings/SKIN_CAPTURE/disable")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.enabled").value(false));

        putSetting(token, "WATER_INTAKE", true, "12:00", today, "Invalid/Timezone")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_REMINDER_TIMEZONE"));

        mockMvc.perform(delete("/api/v1/reminders/settings/SKIN_CAPTURE")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());
        mockMvc.perform(patch("/api/v1/reminders/settings/SKIN_CAPTURE/disable")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("REMINDER_SETTING_NOT_FOUND"));
    }

    @Test
    void calculatesSkippedAndDueRemindersAndIsolatesMembers() throws Exception {
        String ownerToken = signUpAndLogin("reminder-owner@example.com");
        String otherToken = signUpAndLogin("reminder-other@example.com");
        Member owner = memberRepository.findByEmail("reminder-owner@example.com").orElseThrow();
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Seoul"));
        LocalDate today = now.toLocalDate();
        DayOfWeek day = today.getDayOfWeek();
        LifestyleRecord lifestyle = LifestyleRecord.create(owner, today, 420, LocalTime.of(23, 0),
                LocalTime.of(7, 0), false, 1800, DataSourceType.MANUAL);
        lifestyleRepository.save(lifestyle);
        SkinImage image = SkinImage.create(owner, "reminder-test/" + owner.getId(), "image/png", 1024,
                now.minusHours(1).toLocalDateTime(), FaceDirection.FRONT, false);
        image.updateQualityStatus(ImageQualityStatus.PASSED);
        imageRepository.save(image);

        putSetting(ownerToken, "SKIN_CAPTURE", true, "00:00",
                day, "Asia/Seoul").andExpect(status().isOk());
        putSetting(ownerToken, "LIFESTYLE_RECORD", true, "00:00",
                day, "Asia/Seoul").andExpect(status().isOk());
        putSetting(ownerToken, "WATER_INTAKE", true, "00:00",
                day, "Asia/Seoul").andExpect(status().isOk());
        putSetting(ownerToken, "BEDTIME_PREPARATION", true, "00:00",
                day, "Asia/Seoul").andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/reminders/today").header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reminders.length()").value(4))
                .andExpect(jsonPath("$.data.reminders[?(@.type == 'SKIN_CAPTURE')].status")
                        .value(org.hamcrest.Matchers.contains("SKIPPED")))
                .andExpect(jsonPath("$.data.reminders[?(@.type == 'LIFESTYLE_RECORD')].status")
                        .value(org.hamcrest.Matchers.contains("SKIPPED")))
                .andExpect(jsonPath("$.data.reminders[?(@.type == 'WATER_INTAKE')].status")
                        .value(org.hamcrest.Matchers.contains("SKIPPED")))
                .andExpect(jsonPath("$.data.reminders[?(@.type == 'BEDTIME_PREPARATION')].status")
                        .value(org.hamcrest.Matchers.contains("DUE")));

        mockMvc.perform(get("/api/v1/reminders/today").header("Authorization", bearer(otherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reminders.length()").value(0))
                .andExpect(jsonPath("$.data.message").value("오늘 적용되는 리마인더가 없습니다."));
    }

    private org.springframework.test.web.servlet.ResultActions putSetting(
            String token, String type, boolean enabled, String time, DayOfWeek day, String timezone) throws Exception {
        return mockMvc.perform(put("/api/v1/reminders/settings/{type}", type)
                .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"enabled":%s,"reminderTime":"%s","daysOfWeek":["%s"],"timezone":"%s"}
                        """.formatted(enabled, time, day, timezone)));
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
