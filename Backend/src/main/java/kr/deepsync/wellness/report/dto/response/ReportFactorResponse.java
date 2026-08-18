package kr.deepsync.wellness.report.dto.response;

import kr.deepsync.wellness.analysis.domain.*;

public record ReportFactorResponse(
        FactorType factor,
        TargetSkinMetric targetMetric,
        double observedDifference,
        int observationCount,
        AnalysisConfidenceLevel confidenceLevel,
        String summary
) {
    public static ReportFactorResponse from(PersonalFactorAnalysisResult result) {
        return new ReportFactorResponse(result.getFactorType(), result.getTargetMetric(),
                result.getObservedDifference(), result.getExposedCount() + result.getNormalCount(),
                result.getConfidenceLevel(), result.getSummary());
    }
}
