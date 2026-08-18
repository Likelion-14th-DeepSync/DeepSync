package kr.deepsync.wellness.reminder.dto.response;

import kr.deepsync.wellness.reminder.domain.ReminderStatus;
import kr.deepsync.wellness.reminder.domain.ReminderType;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ReminderItemResponse(
        Long settingId,
        ReminderType type,
        LocalDate localDate,
        OffsetDateTime scheduledAt,
        ReminderStatus status,
        String title,
        String description,
        String skipReason
) {
}
