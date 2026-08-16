package kr.deepsync.wellness.experiment.domain;

import java.time.LocalDateTime;
import java.util.List;

public record ExperimentResultCalculation(
        int evaluatedDays,
        int achievedDays,
        int missingDays,
        double achievementRate,
        int beforeAnalysisCount,
        int afterAnalysisCount,
        double beforeRednessScore,
        double afterRednessScore,
        double beforeTroubleScore,
        double afterTroubleScore,
        double beforeDrynessScore,
        double afterDrynessScore,
        double beforeToneUniformityScore,
        double afterToneUniformityScore,
        double beforeOverallScore,
        double afterOverallScore,
        SkinMetric mostChangedMetric,
        double mostChangedAmount,
        ChangeDirection changeDirection,
        ExperimentConfidenceLevel confidenceLevel,
        ExperimentRecommendation recommendation,
        List<String> confidenceReasons,
        String summary,
        LocalDateTime calculatedAt
) {
}
