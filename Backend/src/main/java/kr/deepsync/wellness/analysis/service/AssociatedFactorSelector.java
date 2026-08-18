package kr.deepsync.wellness.analysis.service;

import kr.deepsync.wellness.analysis.domain.*;
import kr.deepsync.wellness.analysis.dto.response.AssociatedFactorResponse;
import kr.deepsync.wellness.analysis.dto.response.LargestSkinChangeResponse;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AssociatedFactorSelector {
    private final FactorThresholdPolicy thresholdPolicy;

    public List<AssociatedFactorResponse> select(List<PersonalFactorAnalysisResult> results,
                                                 LifestyleRecord lifestyle,
                                                 EnvironmentRecord environment,
                                                 LargestSkinChangeResponse largestChange) {
        if (largestChange != null && largestChange.direction() == SkinChangeDirection.UNCHANGED) return List.of();
        TargetSkinMetric largestChangedMetric = largestChange == null ? null : largestChange.metric();
        AssociationDirection expectedDirection = largestChange != null
                && largestChange.direction() == SkinChangeDirection.IMPROVED
                ? AssociationDirection.POSITIVE_ASSOCIATION
                : AssociationDirection.NEGATIVE_ASSOCIATION;
        return results.stream()
                .filter(result -> result.getAnalysisStatus() == FactorAnalysisStatus.ANALYZED)
                .filter(result -> result.getConfidenceLevel() != AnalysisConfidenceLevel.LOW)
                .filter(result -> result.getAssociationDirection() == expectedDirection)
                .filter(result -> result.getObservedDifference() != null
                        && Math.abs(result.getObservedDifference()) >= 1)
                .filter(result -> Boolean.TRUE.equals(thresholdPolicy.isExposed(
                        result.getFactorType(), lifestyle, environment)))
                .filter(result -> largestChangedMetric == null
                        || result.getTargetMetric() == largestChangedMetric
                        || result.getTargetMetric() == TargetSkinMetric.OVERALL)
                .sorted(Comparator
                        .comparing((PersonalFactorAnalysisResult result) ->
                                result.getTargetMetric() == largestChangedMetric ? 1 : 0).reversed()
                        .thenComparing(PersonalFactorAnalysisResult::getConfidenceLevel,
                                Comparator.reverseOrder())
                        .thenComparing(result -> Math.abs(result.getObservedDifference()),
                                Comparator.reverseOrder())
                        .thenComparing(result -> result.getExposedCount() + result.getNormalCount(),
                                Comparator.reverseOrder()))
                .limit(3)
                .map(result -> new AssociatedFactorResponse(result.getFactorType(), result.getTargetMetric(),
                        result.getObservedDifference(), result.getExposedCount() + result.getNormalCount(),
                        result.getConfidenceLevel(), result.getSummary()))
                .toList();
    }
}
