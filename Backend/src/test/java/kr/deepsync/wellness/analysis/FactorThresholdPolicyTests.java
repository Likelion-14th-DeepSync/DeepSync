package kr.deepsync.wellness.analysis;

import kr.deepsync.wellness.analysis.domain.FactorType;
import kr.deepsync.wellness.analysis.domain.TargetSkinMetric;
import kr.deepsync.wellness.analysis.service.FactorThresholdPolicy;
import kr.deepsync.wellness.common.domain.DataSourceType;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

class FactorThresholdPolicyTests {
    private final FactorThresholdPolicy policy = new FactorThresholdPolicy();

    @Test
    void classifiesEveryLifestyleThreshold() {
        LifestyleRecord exposed = LifestyleRecord.create(null, LocalDate.now(), 359,
                LocalTime.of(0, 30), null, true, 1499, DataSourceType.MANUAL);
        LifestyleRecord normal = LifestyleRecord.create(null, LocalDate.now(), 360,
                LocalTime.of(23, 30), null, false, 1500, DataSourceType.MANUAL);

        assertThat(policy.isExposed(FactorType.SHORT_SLEEP, exposed, null)).isTrue();
        assertThat(policy.isExposed(FactorType.LATE_BEDTIME, exposed, null)).isTrue();
        assertThat(policy.isExposed(FactorType.LATE_NIGHT_MEAL, exposed, null)).isTrue();
        assertThat(policy.isExposed(FactorType.LOW_WATER_INTAKE, exposed, null)).isTrue();
        assertThat(policy.isExposed(FactorType.SHORT_SLEEP, normal, null)).isFalse();
        assertThat(policy.isExposed(FactorType.LATE_BEDTIME, normal, null)).isFalse();
        assertThat(policy.isExposed(FactorType.LATE_NIGHT_MEAL, normal, null)).isFalse();
        assertThat(policy.isExposed(FactorType.LOW_WATER_INTAKE, normal, null)).isFalse();
    }

    @Test
    void classifiesEveryEnvironmentThresholdAndMapsMetrics() {
        EnvironmentRecord exposed = EnvironmentRecord.create(null, LocalDate.now(), BigDecimal.valueOf(6),
                BigDecimal.valueOf(30), 39, 81, DataSourceType.MANUAL);
        EnvironmentRecord normal = EnvironmentRecord.create(null, LocalDate.now(), BigDecimal.valueOf(5.9),
                BigDecimal.valueOf(20), 40, 80, DataSourceType.MANUAL);
        EnvironmentRecord cold = EnvironmentRecord.create(null, LocalDate.now(), null,
                BigDecimal.valueOf(10), null, null, DataSourceType.MANUAL);

        assertThat(policy.isExposed(FactorType.HIGH_UV, null, exposed)).isTrue();
        assertThat(policy.isExposed(FactorType.LOW_HUMIDITY, null, exposed)).isTrue();
        assertThat(policy.isExposed(FactorType.HIGH_FINE_DUST, null, exposed)).isTrue();
        assertThat(policy.isExposed(FactorType.HIGH_TEMPERATURE, null, exposed)).isTrue();
        assertThat(policy.isExposed(FactorType.HIGH_UV, null, normal)).isFalse();
        assertThat(policy.isExposed(FactorType.LOW_HUMIDITY, null, normal)).isFalse();
        assertThat(policy.isExposed(FactorType.HIGH_FINE_DUST, null, normal)).isFalse();
        assertThat(policy.isExposed(FactorType.HIGH_TEMPERATURE, null, normal)).isFalse();
        assertThat(policy.isExposed(FactorType.LOW_TEMPERATURE, null, cold)).isTrue();
        assertThat(policy.targetMetrics(FactorType.HIGH_UV))
                .containsExactly(TargetSkinMetric.TONE_UNIFORMITY, TargetSkinMetric.REDNESS);
    }
}
