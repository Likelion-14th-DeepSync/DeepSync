package kr.deepsync.wellness.experiment.dto.response;

import kr.deepsync.wellness.experiment.domain.LifestyleExperimentResult;

public record ExperimentScoreChangesResponse(
        ScoreChangeResponse redness,
        ScoreChangeResponse trouble,
        ScoreChangeResponse dryness,
        ScoreChangeResponse toneUniformity,
        ScoreChangeResponse overall
) {
    public static ExperimentScoreChangesResponse from(LifestyleExperimentResult result) {
        return new ExperimentScoreChangesResponse(
                ScoreChangeResponse.of(result.getBeforeRednessScore(), result.getAfterRednessScore()),
                ScoreChangeResponse.of(result.getBeforeTroubleScore(), result.getAfterTroubleScore()),
                ScoreChangeResponse.of(result.getBeforeDrynessScore(), result.getAfterDrynessScore()),
                ScoreChangeResponse.of(result.getBeforeToneUniformityScore(), result.getAfterToneUniformityScore()),
                ScoreChangeResponse.of(result.getBeforeOverallScore(), result.getAfterOverallScore())
        );
    }
}
