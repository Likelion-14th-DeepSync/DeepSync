package kr.deepsync.wellness.analysis.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record FactorAnalysisCalculation(
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
        String summary,
        LocalDate analyzedFrom,
        LocalDate analyzedTo,
        LocalDateTime calculatedAt
) {
}
