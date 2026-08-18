package kr.deepsync.wellness.report.dto.response;

public record ReportSkinSummaryResponse(
        int analysisCount,
        int recordedDays,
        int periodDays,
        double recordCoverageRate,
        ReportScoreSetResponse averages,
        ReportScoreSetResponse previousAverages,
        ReportScoreSetResponse changes,
        ReportMetricChangeResponse mostImprovedMetric,
        ReportMetricChangeResponse mostWorsenedMetric,
        double averageModelConfidence,
        Double averageImageQuality,
        int excludedQualityCount
) {
}
