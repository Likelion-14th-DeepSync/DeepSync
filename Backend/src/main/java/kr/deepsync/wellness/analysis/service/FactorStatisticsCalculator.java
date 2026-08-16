package kr.deepsync.wellness.analysis.service;

import kr.deepsync.wellness.analysis.domain.*;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class FactorStatisticsCalculator {
    public FactorAnalysisCalculation calculate(FactorType factor, TargetSkinMetric metric,
                                               List<FactorObservation> observations,
                                               LocalDate startDate, LocalDate endDate,
                                               LocalDateTime calculatedAt) {
        List<FactorObservation> exposed = observations.stream().filter(FactorObservation::exposed).toList();
        List<FactorObservation> normal = observations.stream().filter(value -> !value.exposed()).toList();
        int totalDays = (int) ChronoUnit.DAYS.between(startDate, endDate) + 1;
        int missing = Math.max(0, totalDays - observations.size());
        double modelConfidence = round(observations.stream().mapToDouble(FactorObservation::modelConfidence)
                .average().orElse(0));
        boolean enough = exposed.size() >= 3 && normal.size() >= 3;
        Double exposedAverage = exposed.isEmpty() ? null : average(exposed);
        Double normalAverage = normal.isEmpty() ? null : average(normal);
        Double difference = exposedAverage == null || normalAverage == null
                ? null : round(exposedAverage - normalAverage);
        double missingRate = (double) missing / totalDays;
        AnalysisConfidenceLevel confidence = confidence(exposed.size(), normal.size(), observations.size(),
                missingRate, modelConfidence);
        FactorAnalysisStatus status = enough ? FactorAnalysisStatus.ANALYZED : FactorAnalysisStatus.INSUFFICIENT_DATA;
        AssociationDirection direction = enough ? direction(difference) : AssociationDirection.INSUFFICIENT_DATA;
        String summary = summary(factor, metric, status, difference, exposed.size(), normal.size());
        return new FactorAnalysisCalculation(status, exposedAverage, normalAverage, difference,
                exposed.size(), normal.size(), missing, modelConfidence, confidence, direction, summary,
                startDate, endDate, calculatedAt);
    }

    private AnalysisConfidenceLevel confidence(int exposed, int normal, int total, double missingRate,
                                                double modelConfidence) {
        if (exposed >= 7 && normal >= 7 && total >= 20 && missingRate < .2 && modelConfidence >= 75) {
            return AnalysisConfidenceLevel.HIGH;
        }
        if (exposed >= 3 && normal >= 3 && total >= 7 && missingRate < .4 && modelConfidence >= 60) {
            return AnalysisConfidenceLevel.MEDIUM;
        }
        return AnalysisConfidenceLevel.LOW;
    }

    private AssociationDirection direction(double difference) {
        if (difference >= 1) return AssociationDirection.POSITIVE_ASSOCIATION;
        if (difference <= -1) return AssociationDirection.NEGATIVE_ASSOCIATION;
        return AssociationDirection.NO_CLEAR_DIFFERENCE;
    }

    private double average(List<FactorObservation> values) {
        return round(values.stream().mapToDouble(FactorObservation::skinScore).average().orElse(0));
    }

    private String summary(FactorType factor, TargetSkinMetric metric, FactorAnalysisStatus status,
                           Double difference, int exposedCount, int normalCount) {
        if (status == FactorAnalysisStatus.INSUFFICIENT_DATA) {
            int exposedNeeded = Math.max(0, 3 - exposedCount);
            int normalNeeded = Math.max(0, 3 - normalCount);
            return "아직 비교 데이터가 부족합니다. 조건 해당 기록 %d회, 비교 기록 %d회가 더 필요합니다."
                    .formatted(exposedNeeded, normalNeeded);
        }
        String factorName = factorName(factor);
        String metricName = metricName(metric);
        if (Math.abs(difference) < 1) {
            return "%s 여부에 따른 다음 날 %s 점수의 뚜렷한 차이가 관찰되지 않았습니다."
                    .formatted(factorName, metricName);
        }
        String direction = difference < 0 ? "낮게" : "높게";
        return "%s 조건의 다음 날 %s 점수가 비교 기록보다 평균 %.1f점 %s 관찰됐습니다."
                .formatted(factorName, metricName, Math.abs(difference), direction);
    }

    private String factorName(FactorType factor) {
        return switch (factor) {
            case SHORT_SLEEP -> "수면 6시간 미만";
            case LATE_BEDTIME -> "자정 이후 취침";
            case LATE_NIGHT_MEAL -> "야식 섭취";
            case LOW_WATER_INTAKE -> "물 1.5L 미만 섭취";
            case HIGH_UV -> "UV 지수 6 이상";
            case LOW_HUMIDITY -> "습도 40% 미만";
            case HIGH_FINE_DUST -> "미세먼지 81㎍/㎥ 이상";
            case HIGH_TEMPERATURE -> "기온 30℃ 이상";
            case LOW_TEMPERATURE -> "기온 10℃ 이하";
        };
    }

    private String metricName(TargetSkinMetric metric) {
        return switch (metric) {
            case REDNESS -> "붉은기";
            case TROUBLE -> "트러블";
            case DRYNESS -> "건조함";
            case TONE_UNIFORMITY -> "피부톤 균일도";
            case OVERALL -> "종합 피부";
        };
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
