package kr.deepsync.wellness.experiment.dto.response;

import java.time.LocalDate;

public record ProgressSegmentResponse(
        int sequence,
        LocalDate startDate,
        LocalDate endDate,
        int plannedDays,
        int elapsedDays,
        int recordedDays,
        int achievedDays,
        int missingDays,
        double completionRate
) {
}
