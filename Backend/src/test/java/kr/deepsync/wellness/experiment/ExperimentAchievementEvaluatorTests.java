package kr.deepsync.wellness.experiment;

import kr.deepsync.wellness.common.domain.DataSourceType;
import kr.deepsync.wellness.experiment.domain.ExperimentType;
import kr.deepsync.wellness.experiment.service.ExperimentAchievementEvaluator;
import kr.deepsync.wellness.experiment.service.ExperimentEvaluation;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class ExperimentAchievementEvaluatorTests {
    private final ExperimentAchievementEvaluator evaluator = new ExperimentAchievementEvaluator();

    @Test
    void evaluatesAllAutomaticallySupportedExperimentTypes() {
        LifestyleRecord record = record(450, LocalTime.of(23, 30), false, 1800);

        assertAchieved(ExperimentType.SLEEP_AT_LEAST_7_HOURS, record, true);
        assertAchieved(ExperimentType.SLEEP_BEFORE_MIDNIGHT, record, true);
        assertAchieved(ExperimentType.NO_LATE_NIGHT_MEAL, record, true);
        assertAchieved(ExperimentType.WATER_AT_LEAST_1500_ML, record, true);
    }

    @Test
    void evaluatesFailuresAndTreatsMissingValuesAsUnavailable() {
        LifestyleRecord failed = record(300, LocalTime.of(1, 0), true, 900);
        assertAchieved(ExperimentType.SLEEP_AT_LEAST_7_HOURS, failed, false);
        assertAchieved(ExperimentType.SLEEP_BEFORE_MIDNIGHT, failed, false);
        assertAchieved(ExperimentType.NO_LATE_NIGHT_MEAL, failed, false);
        assertAchieved(ExperimentType.WATER_AT_LEAST_1500_ML, failed, false);

        LifestyleRecord missing = record(null, null, null, null);
        assertThat(evaluator.evaluate(ExperimentType.SLEEP_AT_LEAST_7_HOURS, missing)).isEmpty();
        assertThat(evaluator.evaluate(ExperimentType.KEEP_SUNSCREEN_ROUTINE, failed)).isEmpty();
    }

    private void assertAchieved(ExperimentType type, LifestyleRecord record, boolean expected) {
        Optional<ExperimentEvaluation> evaluation = evaluator.evaluate(type, record);
        assertThat(evaluation).isPresent();
        assertThat(evaluation.orElseThrow().achieved()).isEqualTo(expected);
    }

    private LifestyleRecord record(Integer sleep, LocalTime bedtime, Boolean lateNightMeal, Integer water) {
        return LifestyleRecord.create(null, LocalDate.now(), sleep, bedtime, null,
                lateNightMeal, water, DataSourceType.MANUAL);
    }
}
