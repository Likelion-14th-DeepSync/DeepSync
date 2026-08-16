package kr.deepsync.wellness.analysis.service;

import kr.deepsync.wellness.analysis.domain.FactorObservation;
import kr.deepsync.wellness.analysis.domain.FactorType;
import kr.deepsync.wellness.analysis.domain.TargetSkinMetric;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class FactorObservationCollector {
    private final FactorThresholdPolicy thresholdPolicy;

    public List<FactorObservation> collect(FactorType factor, TargetSkinMetric metric,
                                           LocalDate startDate, LocalDate endDate,
                                           Map<LocalDate, LifestyleRecord> lifestyleRecords,
                                           Map<LocalDate, EnvironmentRecord> environmentRecords,
                                           Map<LocalDate, DailySkinScore> dailySkinScores) {
        List<FactorObservation> observations = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            Boolean exposed = thresholdPolicy.isExposed(
                    factor, lifestyleRecords.get(date), environmentRecords.get(date));
            DailySkinScore nextDaySkin = dailySkinScores.get(date.plusDays(1));
            if (exposed == null || nextDaySkin == null) continue;
            observations.add(new FactorObservation(date, exposed, nextDaySkin.score(metric),
                    nextDaySkin.modelConfidence()));
        }
        return observations;
    }
}
