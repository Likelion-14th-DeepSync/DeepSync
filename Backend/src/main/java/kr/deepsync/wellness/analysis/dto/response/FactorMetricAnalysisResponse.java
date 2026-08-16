package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.*;

public record FactorMetricAnalysisResponse(
        TargetSkinMetric targetMetric,
        FactorAnalysisStatus status,
        Double exposedAverage,
        Double normalAverage,
        Double observedDifference,
        int exposedCount,
        int normalCount,
        int missingCount,
        double averageModelConfidence,
        AnalysisConfidenceLevel confidenceLevel,
        AssociationDirection direction,
        String summary
) {
    public static FactorMetricAnalysisResponse from(PersonalFactorAnalysisResult result) {
        return new FactorMetricAnalysisResponse(result.getTargetMetric(), result.getAnalysisStatus(),
                result.getExposedAverage(), result.getNormalAverage(), result.getObservedDifference(),
                result.getExposedCount(), result.getNormalCount(), result.getMissingCount(),
                result.getAverageModelConfidence(), result.getConfidenceLevel(),
                result.getAssociationDirection(), result.getSummary());
    }
}
