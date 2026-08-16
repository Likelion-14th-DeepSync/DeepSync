package kr.deepsync.wellness.experiment.dto.response;

import kr.deepsync.wellness.experiment.domain.ExperimentStatus;

import java.util.List;

public record ExperimentProgressResponse(
        Long experimentId,
        ExperimentStatus status,
        int durationDays,
        int currentDay,
        int remainingDays,
        int recordedDays,
        int achievedDays,
        int missingDays,
        double completionRate,
        List<DailyCheckResponse> dailyChecks
) {
}
