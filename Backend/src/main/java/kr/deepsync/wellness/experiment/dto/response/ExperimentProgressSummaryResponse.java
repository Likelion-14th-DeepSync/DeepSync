package kr.deepsync.wellness.experiment.dto.response;

import kr.deepsync.wellness.experiment.domain.ExperimentPeriod;
import kr.deepsync.wellness.experiment.domain.ExperimentStatus;

import java.util.List;

public record ExperimentProgressSummaryResponse(
        Long experimentId,
        ExperimentStatus status,
        ExperimentPeriod experimentPeriod,
        int durationDays,
        ProgressTotalsResponse overall,
        List<ProgressSegmentResponse> weeklySummaries,
        List<ProgressSegmentResponse> monthlySummaries
) {
}
