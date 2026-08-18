package kr.deepsync.wellness.report.dto.response;

import kr.deepsync.wellness.experiment.domain.*;

public record ReportExperimentResponse(
        Long experimentId,
        ExperimentType experimentType,
        ExperimentPeriod experimentPeriod,
        double achievementRate,
        double overallScoreChange,
        ExperimentConfidenceLevel confidenceLevel,
        ExperimentRecommendation recommendation
) {
    public static ReportExperimentResponse from(LifestyleExperimentResult result) {
        return new ReportExperimentResponse(result.getExperiment().getId(),
                result.getExperiment().getExperimentType(), result.getExperiment().getExperimentPeriod(),
                result.getAchievementRate(), round(result.getAfterOverallScore() - result.getBeforeOverallScore()),
                result.getConfidenceLevel(), result.getRecommendation());
    }

    private static double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
