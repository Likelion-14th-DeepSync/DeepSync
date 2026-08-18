package kr.deepsync.wellness.reminder.dto.response;

import kr.deepsync.wellness.reminder.domain.ReminderSetting;
import kr.deepsync.wellness.reminder.domain.ReminderType;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

public record ReminderSettingResponse(
        Long settingId,
        ReminderType reminderType,
        boolean enabled,
        LocalTime reminderTime,
        Set<DayOfWeek> daysOfWeek,
        String timezone
) {
    public static ReminderSettingResponse from(ReminderSetting setting) {
        return new ReminderSettingResponse(setting.getId(), setting.getReminderType(), setting.isEnabled(),
                setting.getReminderTime(), setting.daySet(), setting.getTimezone());
    }
}
