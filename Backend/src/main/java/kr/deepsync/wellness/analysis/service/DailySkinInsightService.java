package kr.deepsync.wellness.analysis.service;

import kr.deepsync.wellness.analysis.domain.*;
import kr.deepsync.wellness.analysis.dto.response.*;
import kr.deepsync.wellness.analysis.repository.*;
import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.environment.repository.EnvironmentRecordRepository;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import kr.deepsync.wellness.lifestyle.repository.LifestyleRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DailySkinInsightService {
    private final SkinAnalysisRepository analysisRepository;
    private final SkinAnalysisBaselineRepository baselineRepository;
    private final PersonalFactorAnalysisResultRepository factorRepository;
    private final AnalysisConfidenceResultRepository confidenceRepository;
    private final LifestyleRecordRepository lifestyleRepository;
    private final EnvironmentRecordRepository environmentRepository;
    private final AssociatedFactorSelector factorSelector;
    private final DailyInsightMessageFactory messageFactory;
    private final Clock clock;

    public DailySkinInsightResponse getToday(Long memberId) {
        return get(memberId, LocalDate.now(clock));
    }

    public DailySkinInsightResponse get(Long memberId, LocalDate date) {
        if (date.isAfter(LocalDate.now(clock))) throw new BusinessException(ErrorCode.FUTURE_INSIGHT_DATE);
        SkinAnalysis current = representative(memberId, date);
        SkinAnalysis previous = analysisRepository
                .findFirstBySkinImageMemberIdAndStatusAndSkinImageCapturedAtLessThanOrderBySkinImageCapturedAtDesc(
                        memberId, SkinAnalysisStatus.COMPLETED, current.getSkinImage().getCapturedAt())
                .orElse(null);
        SkinAnalysis baseline = baselineRepository.findByMemberId(memberId)
                .map(SkinAnalysisBaseline::getSkinAnalysis).orElse(null);
        SkinScoreChange previousChange = previous == null ? null : SkinScoreChange.between(current, previous);
        SkinScoreChange baselineChange = baseline == null ? null : SkinScoreChange.between(current, baseline);
        LargestSkinChangeResponse largest = largestChange(previousChange != null ? previousChange : baselineChange);

        LocalDate sourceDate = date.minusDays(1);
        LifestyleRecord lifestyle = lifestyleRepository.findByMemberIdAndRecordDate(memberId, sourceDate).orElse(null);
        EnvironmentRecord environment = environmentRepository.findByMemberIdAndRecordDate(memberId, sourceDate).orElse(null);
        List<AssociatedFactorResponse> factors = factorSelector.select(
                factorRepository.findAllByMemberId(memberId), lifestyle, environment,
                largest);

        List<String> warnings = new ArrayList<>();
        if (baseline == null) warnings.add("피부 분석 기준일이 설정되지 않았습니다.");
        if (previous == null) warnings.add("비교할 직전 피부 분석이 없습니다.");
        AnalysisConfidenceResult confidence = confidenceRepository.findByMemberId(memberId).orElse(null);
        if (confidence == null) warnings.add("종합 분석 신뢰도가 아직 계산되지 않았습니다.");

        return new DailySkinInsightResponse(date, DailySkinSnapshotResponse.from(current),
                new DailySkinChangesResponse(baselineChange, previousChange, largest), factors,
                dataUsage(date, sourceDate, lifestyle, environment), confidenceResponse(confidence), warnings,
                messageFactory.create(previousChange, factors), DailySkinInsightResponse.NOTICE);
    }

    private SkinAnalysis representative(Long memberId, LocalDate date) {
        return analysisRepository
                .findAllBySkinImageMemberIdAndSkinImageCapturedAtGreaterThanEqualAndSkinImageCapturedAtLessThanOrderBySkinImageCapturedAtDesc(
                        memberId, date.atStartOfDay(), date.plusDays(1).atStartOfDay())
                .stream()
                .filter(value -> value.getStatus() == SkinAnalysisStatus.COMPLETED)
                .max(Comparator.comparingInt(SkinAnalysis::getConfidenceScore)
                        .thenComparing(value -> value.getSkinImage().getCapturedAt()))
                .orElseThrow(() -> new BusinessException(ErrorCode.DAILY_SKIN_ANALYSIS_NOT_FOUND));
    }

    private LargestSkinChangeResponse largestChange(SkinScoreChange change) {
        if (change == null) return null;
        Map<TargetSkinMetric, Integer> changes = new EnumMap<>(TargetSkinMetric.class);
        changes.put(TargetSkinMetric.REDNESS, change.rednessScoreChange());
        changes.put(TargetSkinMetric.TROUBLE, change.troubleScoreChange());
        changes.put(TargetSkinMetric.DRYNESS, change.drynessScoreChange());
        changes.put(TargetSkinMetric.TONE_UNIFORMITY, change.toneUniformityScoreChange());
        Map.Entry<TargetSkinMetric, Integer> largest = changes.entrySet().stream()
                .max(Comparator.comparingInt(value -> Math.abs(value.getValue()))).orElseThrow();
        int amount = largest.getValue();
        SkinChangeDirection direction = amount >= 1 ? SkinChangeDirection.IMPROVED
                : amount <= -1 ? SkinChangeDirection.WORSENED : SkinChangeDirection.UNCHANGED;
        return new LargestSkinChangeResponse(largest.getKey(), amount, direction);
    }

    private InsightConfidenceResponse confidenceResponse(AnalysisConfidenceResult confidence) {
        return confidence == null ? null : new InsightConfidenceResponse(confidence.getScore(),
                confidence.getConfidenceLevel(), confidence.getCalculatedAt());
    }

    private InsightDataUsageResponse dataUsage(LocalDate analysisDate, LocalDate sourceDate,
                                               LifestyleRecord lifestyle, EnvironmentRecord environment) {
        List<InsightDataItemResponse> used = new ArrayList<>();
        List<InsightDataItemResponse> excluded = new ArrayList<>();
        used.add(new InsightDataItemResponse("SKIN_ANALYSIS", null, analysisDate, "대표 피부 분석을 사용했습니다."));
        if (lifestyle == null) {
            excluded.add(new InsightDataItemResponse("LIFESTYLE_RECORD", null, sourceDate,
                    "전날 생활 기록이 없습니다."));
        } else {
            used.add(new InsightDataItemResponse("LIFESTYLE_RECORD", null, sourceDate, "전날 생활 기록을 사용했습니다."));
            missingLifestyleFields(lifestyle, sourceDate, excluded);
        }
        if (environment == null) {
            excluded.add(new InsightDataItemResponse("ENVIRONMENT_RECORD", null, sourceDate,
                    "전날 환경 기록이 없습니다."));
        } else {
            used.add(new InsightDataItemResponse("ENVIRONMENT_RECORD", null, sourceDate, "전날 환경 기록을 사용했습니다."));
            missingEnvironmentFields(environment, sourceDate, excluded);
        }
        return new InsightDataUsageResponse(used, excluded);
    }

    private void missingLifestyleFields(LifestyleRecord record, LocalDate date,
                                        List<InsightDataItemResponse> excluded) {
        if (record.getSleepDurationMinutes() == null) excluded.add(missing("LIFESTYLE_FIELD", "sleepDurationMinutes", date));
        if (record.getBedtime() == null) excluded.add(missing("LIFESTYLE_FIELD", "bedtime", date));
        if (record.getLateNightMeal() == null) excluded.add(missing("LIFESTYLE_FIELD", "lateNightMeal", date));
        if (record.getWaterIntakeMl() == null) excluded.add(missing("LIFESTYLE_FIELD", "waterIntakeMl", date));
    }

    private void missingEnvironmentFields(EnvironmentRecord record, LocalDate date,
                                          List<InsightDataItemResponse> excluded) {
        if (record.getUvIndex() == null) excluded.add(missing("ENVIRONMENT_FIELD", "uvIndex", date));
        if (record.getTemperature() == null) excluded.add(missing("ENVIRONMENT_FIELD", "temperature", date));
        if (record.getHumidity() == null) excluded.add(missing("ENVIRONMENT_FIELD", "humidity", date));
        if (record.getFineDust() == null) excluded.add(missing("ENVIRONMENT_FIELD", "fineDust", date));
    }

    private InsightDataItemResponse missing(String type, String field, LocalDate date) {
        return new InsightDataItemResponse(type, field, date, "해당 항목의 기록이 없습니다.");
    }
}
