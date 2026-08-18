package kr.deepsync.wellness.reminder.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record TodayReminderResponse(
        List<ReminderItemResponse> reminders,
        String message,
        LocalDateTime generatedAt
) {
}
