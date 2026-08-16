package kr.deepsync.wellness.experiment.dto.response;

import kr.deepsync.wellness.experiment.domain.ExperimentPeriod;
import kr.deepsync.wellness.experiment.domain.ExperimentStatus;
import kr.deepsync.wellness.experiment.domain.ExperimentType;
import kr.deepsync.wellness.experiment.domain.LifestyleExperiment;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExperimentResponse(
        Long experimentId,
        String title,
        ExperimentType experimentType,
        ExperimentPeriod experimentPeriod,
        int durationDays,
        LocalDate startDate,
        LocalDate endDate,
        ExperimentStatus status,
        LocalDateTime completedAt
) {
    public static ExperimentResponse from(LifestyleExperiment experiment) {
        return new ExperimentResponse(experiment.getId(), experiment.getTitle(), experiment.getExperimentType(),
                experiment.getExperimentPeriod(), experiment.getExperimentPeriod().getDays(),
                experiment.getStartDate(), experiment.getEndDate(), experiment.getStatus(),
                experiment.getCompletedAt());
    }
}
