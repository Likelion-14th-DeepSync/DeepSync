package kr.deepsync.wellness.report.dto.response;

public record ReportEnvironmentRiskDaysResponse(
        int highUvDays,
        int lowHumidityDays,
        int highFineDustDays,
        int highTemperatureDays,
        int lowTemperatureDays
) {
}
