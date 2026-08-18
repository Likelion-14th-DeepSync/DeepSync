package kr.deepsync.wellness.report.dto.response;

public record ReportEnvironmentSummaryResponse(
        int recordedDays,
        Double averageUvIndex,
        Double maximumUvIndex,
        Double averageTemperature,
        Double averageHumidity,
        Double averageFineDust,
        ReportEnvironmentRiskDaysResponse riskDays,
        double fieldCompletenessRate
) {
}
