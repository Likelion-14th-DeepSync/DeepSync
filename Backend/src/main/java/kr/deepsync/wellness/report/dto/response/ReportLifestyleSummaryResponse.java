package kr.deepsync.wellness.report.dto.response;

public record ReportLifestyleSummaryResponse(
        int recordedDays,
        Double averageSleepMinutes,
        int sleepAtLeastSevenHoursDays,
        int bedtimeBeforeMidnightDays,
        int lateNightMealDays,
        int waterAtLeast1500MlDays,
        double fieldCompletenessRate
) {
}
