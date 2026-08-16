package kr.deepsync.wellness.experiment.service;

import kr.deepsync.wellness.analysis.domain.SkinAnalysis;
import kr.deepsync.wellness.experiment.domain.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class ExperimentResultCalculator {
    public ExperimentResultCalculation calculate(LifestyleExperiment experiment,
                                                  List<ExperimentDailyCheck> checks,
                                                  List<SkinAnalysis> before,
                                                  List<SkinAnalysis> after,
                                                  LocalDateTime calculatedAt) {
        int evaluated = checks.size();
        int achieved = (int) checks.stream().filter(ExperimentDailyCheck::isAchieved).count();
        int missing = Math.max(0, experiment.getExperimentPeriod().getDays() - evaluated);
        double achievementRate = evaluated == 0 ? 0.0 : round(achieved * 100.0 / evaluated);

        Averages beforeAverage = averages(before);
        Averages afterAverage = averages(after);
        Map<SkinMetric, Double> changes = new EnumMap<>(SkinMetric.class);
        changes.put(SkinMetric.REDNESS, round(afterAverage.redness - beforeAverage.redness));
        changes.put(SkinMetric.TROUBLE, round(afterAverage.trouble - beforeAverage.trouble));
        changes.put(SkinMetric.DRYNESS, round(afterAverage.dryness - beforeAverage.dryness));
        changes.put(SkinMetric.TONE_UNIFORMITY, round(afterAverage.tone - beforeAverage.tone));
        SkinMetric mostChanged = changes.entrySet().stream()
                .max((left, right) -> Double.compare(Math.abs(left.getValue()), Math.abs(right.getValue())))
                .orElseThrow().getKey();
        double mostChangedAmount = changes.get(mostChanged);
        ChangeDirection direction = direction(mostChangedAmount);

        double coverage = (double) evaluated / experiment.getExperimentPeriod().getDays();
        double averageModelConfidence = after.stream().mapToInt(SkinAnalysis::getConfidenceScore).average().orElse(0);
        ExperimentConfidenceLevel confidence = confidence(before.size(), after.size(), coverage, averageModelConfidence);
        List<String> reasons = confidenceReasons(before.size(), after.size(), coverage, averageModelConfidence);
        double overallChange = round(afterAverage.overall - beforeAverage.overall);
        ExperimentRecommendation recommendation = recommendation(confidence, achievementRate, overallChange);

        return new ExperimentResultCalculation(evaluated, achieved, missing, achievementRate,
                before.size(), after.size(), beforeAverage.redness, afterAverage.redness,
                beforeAverage.trouble, afterAverage.trouble, beforeAverage.dryness, afterAverage.dryness,
                beforeAverage.tone, afterAverage.tone, beforeAverage.overall, afterAverage.overall,
                mostChanged, mostChangedAmount, direction, confidence, recommendation, reasons,
                summary(direction, confidence), calculatedAt);
    }

    private Averages averages(List<SkinAnalysis> analyses) {
        return new Averages(
                average(analyses.stream().map(SkinAnalysis::getRednessScore).toList()),
                average(analyses.stream().map(SkinAnalysis::getTroubleScore).toList()),
                average(analyses.stream().map(SkinAnalysis::getDrynessScore).toList()),
                average(analyses.stream().map(SkinAnalysis::getToneUniformityScore).toList()),
                average(analyses.stream().map(SkinAnalysis::getOverallScore).toList()));
    }

    private double average(List<Integer> values) {
        return round(values.stream().mapToInt(Integer::intValue).average().orElse(0));
    }

    private ExperimentConfidenceLevel confidence(int before, int after, double coverage, double modelConfidence) {
        if (before >= 3 && after >= 3 && coverage >= .8 && modelConfidence >= 75) {
            return ExperimentConfidenceLevel.HIGH;
        }
        if (before >= 2 && after >= 2 && coverage >= .7) {
            return ExperimentConfidenceLevel.MEDIUM;
        }
        return ExperimentConfidenceLevel.LOW;
    }

    private List<String> confidenceReasons(int before, int after, double coverage, double modelConfidence) {
        List<String> reasons = new ArrayList<>();
        if (before < 3) reasons.add("실험 전 피부 분석이 3개 미만입니다.");
        if (after < 3) reasons.add("실험 후 피부 분석이 3개 미만입니다.");
        if (coverage < .8) reasons.add("실험 실천 기록률이 80% 미만입니다.");
        if (modelConfidence < 75) reasons.add("피부 분석의 평균 모델 신뢰도가 75점 미만입니다.");
        return reasons;
    }

    private ExperimentRecommendation recommendation(ExperimentConfidenceLevel confidence,
                                                      double achievementRate, double overallChange) {
        if (confidence == ExperimentConfidenceLevel.LOW || achievementRate < 70) {
            return ExperimentRecommendation.MORE_DATA_NEEDED;
        }
        if (overallChange >= 2) return ExperimentRecommendation.CONTINUE;
        if (overallChange <= -2) return ExperimentRecommendation.RECONSIDER;
        return ExperimentRecommendation.NEUTRAL;
    }

    private ChangeDirection direction(double change) {
        if (change >= 1) return ChangeDirection.IMPROVED;
        if (change <= -1) return ChangeDirection.WORSENED;
        return ChangeDirection.UNCHANGED;
    }

    private String summary(ChangeDirection direction, ExperimentConfidenceLevel confidence) {
        if (confidence == ExperimentConfidenceLevel.LOW) {
            return "아직 데이터가 충분하지 않아 습관과 피부 변화의 경향을 판단하기 어렵습니다.";
        }
        return switch (direction) {
            case IMPROVED -> "실험 기간 동안 해당 피부 지표가 좋아지는 경향이 관찰됐습니다.";
            case WORSENED -> "실험 기간 동안 해당 피부 지표가 낮아지는 경향이 관찰됐습니다.";
            case UNCHANGED -> "실험 전후 피부 지표에서 뚜렷한 변화가 관찰되지 않았습니다.";
        };
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private record Averages(double redness, double trouble, double dryness, double tone, double overall) {
    }
}
