package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.AnalysisConfidenceLevel;
import kr.deepsync.wellness.analysis.domain.FactorType;
import kr.deepsync.wellness.analysis.domain.TargetSkinMetric;

public record AssociatedFactorResponse(
        FactorType factor,
        TargetSkinMetric targetMetric,
        double observedDifference,
        int observationCount,
        AnalysisConfidenceLevel confidenceLevel,
        String description
) {
}
