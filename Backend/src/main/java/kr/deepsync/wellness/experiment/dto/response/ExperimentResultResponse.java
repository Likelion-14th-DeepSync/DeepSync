package kr.deepsync.wellness.experiment.dto.response;

import kr.deepsync.wellness.experiment.domain.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public record ExperimentResultResponse(
        Long resultId,
        Long experimentId,
        ExperimentPeriod period,
        ExperimentType experimentType,
        double achievementRate,
        int evaluatedDays,
        int achievedDays,
        int missingDays,
        int beforeAnalysisCount,
        int afterAnalysisCount,
        ExperimentScoreChangesResponse scoreChanges,
        SkinMetric mostChangedMetric,
        double mostChangedAmount,
        ChangeDirection changeDirection,
        ExperimentConfidenceLevel confidenceLevel,
        ExperimentRecommendation recommendation,
        List<String> confidenceReasons,
        String summary,
        LocalDateTime calculatedAt
) {
    public static ExperimentResultResponse from(LifestyleExperimentResult result) {
        LifestyleExperiment experiment = result.getExperiment();
        List<String> reasons = result.getConfidenceReasons().isBlank()
                ? List.of()
                : Arrays.asList(result.getConfidenceReasons().split("\\|"));
        return new ExperimentResultResponse(
                result.getId(), experiment.getId(), experiment.getExperimentPeriod(), experiment.getExperimentType(),
                result.getAchievementRate(), result.getEvaluatedDays(), result.getAchievedDays(),
                result.getMissingDays(), result.getBeforeAnalysisCount(), result.getAfterAnalysisCount(),
                ExperimentScoreChangesResponse.from(result), result.getMostChangedMetric(),
                result.getMostChangedAmount(), result.getChangeDirection(), result.getConfidenceLevel(),
                result.getRecommendation(), reasons, result.getSummary(), result.getCalculatedAt());
    }
}
