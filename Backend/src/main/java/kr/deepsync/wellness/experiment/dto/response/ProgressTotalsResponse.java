package kr.deepsync.wellness.experiment.dto.response;

public record ProgressTotalsResponse(
        int elapsedDays,
        int recordedDays,
        int achievedDays,
        int missingDays,
        double completionRate
) {
}
