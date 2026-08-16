package kr.deepsync.wellness.experiment.service;

import kr.deepsync.wellness.experiment.domain.ExperimentType;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.Optional;

@Component
public class ExperimentAchievementEvaluator {

    public Optional<ExperimentEvaluation> evaluate(ExperimentType type, LifestyleRecord record) {
        return switch (type) {
            case SLEEP_AT_LEAST_7_HOURS -> optional(record.getSleepDurationMinutes(),
                    value -> new ExperimentEvaluation(value >= 420, value + " minutes"));
            case SLEEP_BEFORE_MIDNIGHT -> optional(record.getBedtime(),
                    value -> new ExperimentEvaluation(!value.isBefore(LocalTime.of(18, 0)), value.toString()));
            case NO_LATE_NIGHT_MEAL -> optional(record.getLateNightMeal(),
                    value -> new ExperimentEvaluation(!value, value.toString()));
            case WATER_AT_LEAST_1500_ML -> optional(record.getWaterIntakeMl(),
                    value -> new ExperimentEvaluation(value >= 1500, value + " ml"));
            case KEEP_SUNSCREEN_ROUTINE -> Optional.empty();
        };
    }

    private <T> Optional<ExperimentEvaluation> optional(
            T value, java.util.function.Function<T, ExperimentEvaluation> evaluator) {
        return value == null ? Optional.empty() : Optional.of(evaluator.apply(value));
    }
}
