package kr.deepsync.wellness.reminder.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

public record ReminderSettingRequest(
        boolean enabled,
        @NotNull LocalTime reminderTime,
        @NotEmpty Set<DayOfWeek> daysOfWeek,
        @NotBlank String timezone
) {
}
