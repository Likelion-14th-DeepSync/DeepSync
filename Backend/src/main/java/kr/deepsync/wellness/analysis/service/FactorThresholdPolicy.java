package kr.deepsync.wellness.analysis.service;

import kr.deepsync.wellness.analysis.domain.FactorType;
import kr.deepsync.wellness.analysis.domain.TargetSkinMetric;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Component
public class FactorThresholdPolicy {
    private static final LocalTime AFTER_MIDNIGHT_END = LocalTime.of(6, 0);

    public List<TargetSkinMetric> targetMetrics(FactorType factor) {
        return switch (factor) {
            case SHORT_SLEEP, LATE_BEDTIME -> List.of(TargetSkinMetric.REDNESS, TargetSkinMetric.OVERALL);
            case LATE_NIGHT_MEAL -> List.of(TargetSkinMetric.TROUBLE, TargetSkinMetric.OVERALL);
            case LOW_WATER_INTAKE -> List.of(TargetSkinMetric.DRYNESS, TargetSkinMetric.OVERALL);
            case HIGH_UV -> List.of(TargetSkinMetric.TONE_UNIFORMITY, TargetSkinMetric.REDNESS);
            case LOW_HUMIDITY, LOW_TEMPERATURE -> List.of(TargetSkinMetric.DRYNESS);
            case HIGH_FINE_DUST -> List.of(TargetSkinMetric.TROUBLE, TargetSkinMetric.REDNESS);
            case HIGH_TEMPERATURE -> List.of(TargetSkinMetric.REDNESS);
        };
    }

    public Boolean isExposed(FactorType factor, LifestyleRecord lifestyle, EnvironmentRecord environment) {
        return switch (factor) {
            case SHORT_SLEEP -> lifestyle == null || lifestyle.getSleepDurationMinutes() == null
                    ? null : lifestyle.getSleepDurationMinutes() < 360;
            case LATE_BEDTIME -> lifestyle == null || lifestyle.getBedtime() == null
                    ? null : lifestyle.getBedtime().isBefore(AFTER_MIDNIGHT_END);
            case LATE_NIGHT_MEAL -> lifestyle == null ? null : lifestyle.getLateNightMeal();
            case LOW_WATER_INTAKE -> lifestyle == null || lifestyle.getWaterIntakeMl() == null
                    ? null : lifestyle.getWaterIntakeMl() < 1500;
            case HIGH_UV -> environment == null || environment.getUvIndex() == null
                    ? null : environment.getUvIndex().compareTo(BigDecimal.valueOf(6)) >= 0;
            case LOW_HUMIDITY -> environment == null || environment.getHumidity() == null
                    ? null : environment.getHumidity() < 40;
            case HIGH_FINE_DUST -> environment == null || environment.getFineDust() == null
                    ? null : environment.getFineDust() >= 81;
            case HIGH_TEMPERATURE -> environment == null || environment.getTemperature() == null
                    ? null : environment.getTemperature().compareTo(BigDecimal.valueOf(30)) >= 0;
            case LOW_TEMPERATURE -> environment == null || environment.getTemperature() == null
                    ? null : environment.getTemperature().compareTo(BigDecimal.valueOf(10)) <= 0;
        };
    }
}
