package kr.deepsync.wellness.report.service;

import kr.deepsync.wellness.analysis.domain.*;
import kr.deepsync.wellness.analysis.dto.response.InsightConfidenceResponse;
import kr.deepsync.wellness.analysis.repository.*;
import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.dashboard.dto.response.DashboardExperimentResponse;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.environment.repository.EnvironmentRecordRepository;
import kr.deepsync.wellness.experiment.domain.*;
import kr.deepsync.wellness.experiment.dto.response.ExperimentProgressResponse;
import kr.deepsync.wellness.experiment.dto.response.ExperimentResponse;
import kr.deepsync.wellness.experiment.repository.*;
import kr.deepsync.wellness.experiment.service.LifestyleExperimentService;
import kr.deepsync.wellness.image.domain.SkinImageQuality;
import kr.deepsync.wellness.image.repository.SkinImageQualityRepository;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import kr.deepsync.wellness.lifestyle.repository.LifestyleRecordRepository;
import kr.deepsync.wellness.report.domain.ReportType;
import kr.deepsync.wellness.report.dto.response.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.function.ToDoubleFunction;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SkinReportService {
    private final SkinAnalysisRepository analysisRepository;
    private final SkinImageQualityRepository qualityRepository;
    private final LifestyleRecordRepository lifestyleRepository;
    private final EnvironmentRecordRepository environmentRepository;
    private final PersonalFactorAnalysisResultRepository factorRepository;
    private final LifestyleExperimentRepository experimentRepository;
    private final LifestyleExperimentResultRepository experimentResultRepository;
    private final LifestyleExperimentService experimentService;
    private final AnalysisConfidenceResultRepository confidenceRepository;
    private final Clock clock;

    public SkinReportResponse weekly(Long memberId, LocalDate requestedDate) {
        LocalDate today = LocalDate.now(clock);
        LocalDate anchor = requestedDate == null ? today : requestedDate;
        if (anchor.isAfter(today)) throw new BusinessException(ErrorCode.FUTURE_REPORT_PERIOD);
        LocalDate displayStart = anchor.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate displayEnd = displayStart.plusDays(6);
        return report(memberId, ReportType.WEEKLY, displayStart, displayEnd,
                displayStart.minusWeeks(1), displayEnd.minusWeeks(1), today);
    }

    public SkinReportResponse monthly(Long memberId, Integer year, Integer month) {
        LocalDate today = LocalDate.now(clock);
        YearMonth target;
        if (year == null && month == null) {
            target = YearMonth.from(today);
        } else {
            if (year == null || month == null) throw new BusinessException(ErrorCode.INVALID_MONTHLY_REPORT_PERIOD);
            try {
                target = YearMonth.of(year, month);
            } catch (DateTimeException exception) {
                throw new BusinessException(ErrorCode.INVALID_MONTHLY_REPORT_PERIOD);
            }
        }
        if (target.isAfter(YearMonth.from(today))) throw new BusinessException(ErrorCode.FUTURE_REPORT_PERIOD);
        YearMonth previous = target.minusMonths(1);
        return report(memberId, ReportType.MONTHLY, target.atDay(1), target.atEndOfMonth(),
                previous.atDay(1), previous.atEndOfMonth(), today);
    }

    private SkinReportResponse report(Long memberId, ReportType type, LocalDate displayStart,
                                      LocalDate displayEnd, LocalDate previousStart,
                                      LocalDate previousEnd, LocalDate today) {
        LocalDate calculatedEnd = displayEnd.isAfter(today) ? today : displayEnd;
        int periodDays = days(displayStart, calculatedEnd);
        List<String> warnings = new ArrayList<>();
        ReportSkinSummaryResponse skin = skinSummary(memberId, displayStart, calculatedEnd,
                previousStart, previousEnd, periodDays, warnings);
        ReportLifestyleSummaryResponse lifestyle = lifestyleSummary(memberId, displayStart, calculatedEnd, periodDays);
        ReportEnvironmentSummaryResponse environment = environmentSummary(memberId, displayStart, calculatedEnd, periodDays);
        List<ReportFactorResponse> factors = topFactors(memberId);
        DashboardExperimentResponse activeExperiment = activeExperiment(memberId, displayStart, calculatedEnd);
        List<ReportExperimentResponse> completed = completedExperiments(memberId, displayStart, calculatedEnd);
        InsightConfidenceResponse confidence = confidenceRepository.findByMemberId(memberId)
                .map(value -> new InsightConfidenceResponse(value.getScore(), value.getConfidenceLevel(),
                        value.getCalculatedAt()))
                .orElseGet(() -> {
                    warnings.add("종합 분석 신뢰도가 아직 계산되지 않았습니다.");
                    return null;
                });
        return new SkinReportResponse(type,
                new ReportPeriodResponse(displayStart, displayEnd, days(displayStart, displayEnd)),
                new ReportPeriodResponse(displayStart, calculatedEnd, periodDays), skin, lifestyle, environment,
                factors, SkinReportResponse.FACTOR_NOTICE, activeExperiment, completed, confidence,
                warnings, SkinReportResponse.NOTICE, LocalDateTime.now(clock));
    }

    private ReportSkinSummaryResponse skinSummary(Long memberId, LocalDate start, LocalDate end,
                                                   LocalDate previousStart, LocalDate previousEnd,
                                                   int periodDays, List<String> warnings) {
        List<SkinAnalysis> currentAnalyses = completedAnalyses(memberId, start, end);
        List<SkinAnalysis> previousAnalyses = completedAnalyses(memberId, previousStart, previousEnd);
        List<DailyScores> currentDaily = dailyScores(currentAnalyses);
        List<DailyScores> previousDaily = dailyScores(previousAnalyses);
        ReportScoreSetResponse current = averages(currentDaily);
        ReportScoreSetResponse previous = averages(previousDaily);
        ReportScoreSetResponse changes = current == null || previous == null ? null : changes(current, previous);
        if (current == null) warnings.add("현재 기간의 완료된 피부 분석이 없습니다.");
        if (previous == null) warnings.add("이전 기간의 피부 분석이 없어 점수 변화를 비교할 수 없습니다.");
        List<SkinImageQuality> qualities = qualityRepository
                .findAllBySkinImageMemberIdAndSkinImageCapturedAtGreaterThanEqualAndSkinImageCapturedAtLessThan(
                        memberId, start.atStartOfDay(), end.plusDays(1).atStartOfDay());
        Double qualityAverage = qualities.isEmpty() ? null
                : round(qualities.stream().mapToInt(SkinImageQuality::getOverallScore).average().orElse(0));
        return new ReportSkinSummaryResponse(currentAnalyses.size(), currentDaily.size(), periodDays,
                percent(currentDaily.size(), periodDays), current, previous, changes,
                improved(changes), worsened(changes),
                currentAnalyses.isEmpty() ? 0 : round(currentAnalyses.stream()
                        .mapToInt(SkinAnalysis::getConfidenceScore).average().orElse(0)),
                qualityAverage, Math.max(0, currentAnalyses.size() - qualities.size()));
    }

    private ReportLifestyleSummaryResponse lifestyleSummary(Long memberId, LocalDate start,
                                                             LocalDate end, int periodDays) {
        List<LifestyleRecord> records = lifestyleRepository
                .findAllByMemberIdAndRecordDateBetweenOrderByRecordDateAsc(memberId, start, end);
        int completedFields = records.stream().mapToInt(this::lifestyleFields).sum();
        OptionalDouble sleepAverage = records.stream().filter(value -> value.getSleepDurationMinutes() != null)
                .mapToInt(LifestyleRecord::getSleepDurationMinutes).average();
        return new ReportLifestyleSummaryResponse(records.size(),
                sleepAverage.isPresent() ? round(sleepAverage.getAsDouble()) : null,
                (int) records.stream().filter(value -> value.getSleepDurationMinutes() != null
                        && value.getSleepDurationMinutes() >= 420).count(),
                (int) records.stream().filter(value -> value.getBedtime() != null
                        && !value.getBedtime().isBefore(LocalTime.of(6, 0))).count(),
                (int) records.stream().filter(value -> Boolean.TRUE.equals(value.getLateNightMeal())).count(),
                (int) records.stream().filter(value -> value.getWaterIntakeMl() != null
                        && value.getWaterIntakeMl() >= 1500).count(),
                percent(completedFields, periodDays * 4));
    }

    private ReportEnvironmentSummaryResponse environmentSummary(Long memberId, LocalDate start,
                                                                 LocalDate end, int periodDays) {
        List<EnvironmentRecord> records = environmentRepository
                .findAllByMemberIdAndRecordDateBetweenOrderByRecordDateAsc(memberId, start, end);
        int completedFields = records.stream().mapToInt(this::environmentFields).sum();
        return new ReportEnvironmentSummaryResponse(records.size(),
                averageDecimal(records, EnvironmentRecord::getUvIndex),
                records.stream().map(EnvironmentRecord::getUvIndex).filter(Objects::nonNull)
                        .max(BigDecimal::compareTo).map(BigDecimal::doubleValue).map(this::round).orElse(null),
                averageDecimal(records, EnvironmentRecord::getTemperature),
                averageInteger(records, EnvironmentRecord::getHumidity),
                averageInteger(records, EnvironmentRecord::getFineDust),
                new ReportEnvironmentRiskDaysResponse(
                        (int) records.stream().filter(value -> value.getUvIndex() != null
                                && value.getUvIndex().compareTo(BigDecimal.valueOf(6)) >= 0).count(),
                        (int) records.stream().filter(value -> value.getHumidity() != null && value.getHumidity() < 40).count(),
                        (int) records.stream().filter(value -> value.getFineDust() != null && value.getFineDust() >= 81).count(),
                        (int) records.stream().filter(value -> value.getTemperature() != null
                                && value.getTemperature().compareTo(BigDecimal.valueOf(30)) >= 0).count(),
                        (int) records.stream().filter(value -> value.getTemperature() != null
                                && value.getTemperature().compareTo(BigDecimal.valueOf(10)) <= 0).count()),
                percent(completedFields, periodDays * 4));
    }

    private List<ReportFactorResponse> topFactors(Long memberId) {
        return factorRepository.findAllByMemberId(memberId).stream()
                .filter(value -> value.getAnalysisStatus() == FactorAnalysisStatus.ANALYZED)
                .filter(value -> value.getConfidenceLevel() != AnalysisConfidenceLevel.LOW)
                .filter(value -> value.getObservedDifference() != null
                        && Math.abs(value.getObservedDifference()) >= 1)
                .sorted(Comparator.comparing(PersonalFactorAnalysisResult::getConfidenceLevel).reversed()
                        .thenComparing(value -> Math.abs(value.getObservedDifference()), Comparator.reverseOrder())
                        .thenComparing(value -> value.getExposedCount() + value.getNormalCount(), Comparator.reverseOrder()))
                .limit(3).map(ReportFactorResponse::from).toList();
    }

    private DashboardExperimentResponse activeExperiment(Long memberId, LocalDate start, LocalDate end) {
        Optional<LifestyleExperiment> optional = experimentRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId)
                .stream().filter(value -> (value.getStatus() == ExperimentStatus.ACTIVE
                                || value.getStatus() == ExperimentStatus.SCHEDULED)
                        && !value.getStartDate().isAfter(end) && !value.getEndDate().isBefore(start)).findFirst();
        if (optional.isEmpty()) return null;
        LifestyleExperiment experiment = optional.get();
        ExperimentProgressResponse progress = experimentService.progress(memberId, experiment.getId());
        return new DashboardExperimentResponse(ExperimentResponse.from(experiment), progress);
    }

    private List<ReportExperimentResponse> completedExperiments(Long memberId, LocalDate start, LocalDate end) {
        return experimentResultRepository.findAllByExperimentMemberId(memberId).stream()
                .filter(value -> value.getExperiment().getCompletedAt() != null)
                .filter(value -> {
                    LocalDate completed = value.getExperiment().getCompletedAt().toLocalDate();
                    return !completed.isBefore(start) && !completed.isAfter(end);
                }).map(ReportExperimentResponse::from).toList();
    }

    private List<SkinAnalysis> completedAnalyses(Long memberId, LocalDate start, LocalDate end) {
        return analysisRepository
                .findAllBySkinImageMemberIdAndSkinImageCapturedAtGreaterThanEqualAndSkinImageCapturedAtLessThanOrderBySkinImageCapturedAtDesc(
                        memberId, start.atStartOfDay(), end.plusDays(1).atStartOfDay()).stream()
                .filter(value -> value.getStatus() == SkinAnalysisStatus.COMPLETED).toList();
    }

    private List<DailyScores> dailyScores(List<SkinAnalysis> analyses) {
        return analyses.stream().collect(Collectors.groupingBy(value ->
                        value.getSkinImage().getCapturedAt().toLocalDate())).values().stream()
                .map(values -> new DailyScores(
                        values.stream().mapToInt(SkinAnalysis::getRednessScore).average().orElse(0),
                        values.stream().mapToInt(SkinAnalysis::getTroubleScore).average().orElse(0),
                        values.stream().mapToInt(SkinAnalysis::getDrynessScore).average().orElse(0),
                        values.stream().mapToInt(SkinAnalysis::getToneUniformityScore).average().orElse(0),
                        values.stream().mapToInt(SkinAnalysis::getOverallScore).average().orElse(0))).toList();
    }

    private ReportScoreSetResponse averages(List<DailyScores> values) {
        if (values.isEmpty()) return null;
        return new ReportScoreSetResponse(average(values, DailyScores::redness),
                average(values, DailyScores::trouble), average(values, DailyScores::dryness),
                average(values, DailyScores::tone), average(values, DailyScores::overall));
    }

    private ReportScoreSetResponse changes(ReportScoreSetResponse current, ReportScoreSetResponse previous) {
        return new ReportScoreSetResponse(round(current.redness() - previous.redness()),
                round(current.trouble() - previous.trouble()), round(current.dryness() - previous.dryness()),
                round(current.toneUniformity() - previous.toneUniformity()),
                round(current.overall() - previous.overall()));
    }

    private ReportMetricChangeResponse improved(ReportScoreSetResponse changes) {
        return extreme(changes, true);
    }

    private ReportMetricChangeResponse worsened(ReportScoreSetResponse changes) {
        return extreme(changes, false);
    }

    private ReportMetricChangeResponse extreme(ReportScoreSetResponse changes, boolean positive) {
        if (changes == null) return null;
        Map<TargetSkinMetric, Double> values = new EnumMap<>(TargetSkinMetric.class);
        values.put(TargetSkinMetric.REDNESS, changes.redness());
        values.put(TargetSkinMetric.TROUBLE, changes.trouble());
        values.put(TargetSkinMetric.DRYNESS, changes.dryness());
        values.put(TargetSkinMetric.TONE_UNIFORMITY, changes.toneUniformity());
        return values.entrySet().stream().filter(value -> positive ? value.getValue() >= 1 : value.getValue() <= -1)
                .max(positive ? Map.Entry.comparingByValue() : Map.Entry.<TargetSkinMetric, Double>comparingByValue().reversed())
                .map(value -> new ReportMetricChangeResponse(value.getKey(), value.getValue())).orElse(null);
    }

    private double average(List<DailyScores> values, ToDoubleFunction<DailyScores> mapper) {
        return round(values.stream().mapToDouble(mapper).average().orElse(0));
    }

    private Double averageDecimal(List<EnvironmentRecord> values,
                                  java.util.function.Function<EnvironmentRecord, BigDecimal> mapper) {
        OptionalDouble average = values.stream().map(mapper).filter(Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue).average();
        return average.isPresent() ? round(average.getAsDouble()) : null;
    }

    private Double averageInteger(List<EnvironmentRecord> values,
                                  java.util.function.Function<EnvironmentRecord, Integer> mapper) {
        OptionalDouble average = values.stream().map(mapper).filter(Objects::nonNull)
                .mapToInt(Integer::intValue).average();
        return average.isPresent() ? round(average.getAsDouble()) : null;
    }

    private int lifestyleFields(LifestyleRecord value) {
        return (value.getSleepDurationMinutes() == null ? 0 : 1) + (value.getBedtime() == null ? 0 : 1)
                + (value.getLateNightMeal() == null ? 0 : 1) + (value.getWaterIntakeMl() == null ? 0 : 1);
    }

    private int environmentFields(EnvironmentRecord value) {
        return (value.getUvIndex() == null ? 0 : 1) + (value.getTemperature() == null ? 0 : 1)
                + (value.getHumidity() == null ? 0 : 1) + (value.getFineDust() == null ? 0 : 1);
    }

    private int days(LocalDate start, LocalDate end) {
        return (int) ChronoUnit.DAYS.between(start, end) + 1;
    }

    private double percent(int value, int total) {
        return total == 0 ? 0 : round(value * 100.0 / total);
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private record DailyScores(double redness, double trouble, double dryness, double tone, double overall) {
    }
}
