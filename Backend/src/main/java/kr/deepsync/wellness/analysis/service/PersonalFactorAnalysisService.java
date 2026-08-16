package kr.deepsync.wellness.analysis.service;

import kr.deepsync.wellness.analysis.domain.*;
import kr.deepsync.wellness.analysis.dto.response.FactorMetricAnalysisResponse;
import kr.deepsync.wellness.analysis.dto.response.PersonalFactorAnalysisResponse;
import kr.deepsync.wellness.analysis.repository.PersonalFactorAnalysisResultRepository;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisRepository;
import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.environment.repository.EnvironmentRecordRepository;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import kr.deepsync.wellness.lifestyle.repository.LifestyleRecordRepository;
import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.exception.MemberNotFoundException;
import kr.deepsync.wellness.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.ToIntFunction;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PersonalFactorAnalysisService {
    private static final int DEFAULT_PERIOD_DAYS = 90;
    private static final int MIN_PERIOD_DAYS = 7;
    private static final int MAX_PERIOD_DAYS = 365;

    private final PersonalFactorAnalysisResultRepository resultRepository;
    private final SkinAnalysisRepository skinAnalysisRepository;
    private final LifestyleRecordRepository lifestyleRepository;
    private final EnvironmentRecordRepository environmentRepository;
    private final MemberRepository memberRepository;
    private final FactorThresholdPolicy thresholdPolicy;
    private final FactorObservationCollector observationCollector;
    private final FactorStatisticsCalculator calculator;
    private final Clock clock;

    @Transactional
    public List<PersonalFactorAnalysisResponse> recalculate(Long memberId, Integer requestedPeriodDays) {
        int periodDays = requestedPeriodDays == null ? DEFAULT_PERIOD_DAYS : requestedPeriodDays;
        if (periodDays < MIN_PERIOD_DAYS || periodDays > MAX_PERIOD_DAYS) {
            throw new BusinessException(ErrorCode.INVALID_FACTOR_ANALYSIS_PERIOD);
        }
        Member member = memberRepository.findById(memberId).orElseThrow(MemberNotFoundException::new);
        LocalDate analyzedTo = LocalDate.now(clock).minusDays(1);
        LocalDate analyzedFrom = analyzedTo.minusDays(periodDays - 1L);
        LocalDateTime calculatedAt = LocalDateTime.now(clock);

        Map<LocalDate, LifestyleRecord> lifestyle = lifestyleRepository
                .findAllByMemberIdAndRecordDateBetweenOrderByRecordDateAsc(memberId, analyzedFrom, analyzedTo)
                .stream().collect(Collectors.toMap(LifestyleRecord::getRecordDate, value -> value));
        Map<LocalDate, EnvironmentRecord> environment = environmentRepository
                .findAllByMemberIdAndRecordDateBetweenOrderByRecordDateAsc(memberId, analyzedFrom, analyzedTo)
                .stream().collect(Collectors.toMap(EnvironmentRecord::getRecordDate, value -> value));
        Map<LocalDate, DailySkinScore> dailySkinScores = dailySkinScores(memberId,
                analyzedFrom.plusDays(1), analyzedTo.plusDays(1));

        List<PersonalFactorAnalysisResult> results = new ArrayList<>();
        for (FactorType factor : FactorType.values()) {
            for (TargetSkinMetric metric : thresholdPolicy.targetMetrics(factor)) {
                List<FactorObservation> observations = observationCollector.collect(factor, metric,
                        analyzedFrom, analyzedTo, lifestyle, environment, dailySkinScores);
                FactorAnalysisCalculation calculation = calculator.calculate(factor, metric, observations,
                        analyzedFrom, analyzedTo, calculatedAt);
                results.add(PersonalFactorAnalysisResult.create(member, factor, metric, calculation));
            }
        }
        resultRepository.deleteAllByMemberId(memberId);
        resultRepository.flush();
        resultRepository.saveAll(results);
        return group(results);
    }

    public List<PersonalFactorAnalysisResponse> getAll(Long memberId) {
        return group(resultRepository.findAllByMemberId(memberId));
    }

    public PersonalFactorAnalysisResponse get(Long memberId, FactorType factor) {
        List<PersonalFactorAnalysisResult> results = resultRepository.findAllByMemberIdAndFactorType(memberId, factor);
        if (results.isEmpty()) throw new BusinessException(ErrorCode.FACTOR_ANALYSIS_NOT_FOUND);
        return toResponse(factor, results);
    }

    private Map<LocalDate, DailySkinScore> dailySkinScores(Long memberId, LocalDate from, LocalDate to) {
        Map<LocalDate, List<SkinAnalysis>> grouped = skinAnalysisRepository
                .findAllBySkinImageMemberIdAndSkinImageCapturedAtGreaterThanEqualAndSkinImageCapturedAtLessThanOrderBySkinImageCapturedAtDesc(
                        memberId, from.atStartOfDay(), to.plusDays(1).atStartOfDay())
                .stream()
                .filter(value -> value.getStatus() == SkinAnalysisStatus.COMPLETED)
                .collect(Collectors.groupingBy(value -> value.getSkinImage().getCapturedAt().toLocalDate()));
        Map<LocalDate, DailySkinScore> result = new HashMap<>();
        grouped.forEach((date, analyses) -> result.put(date, new DailySkinScore(
                average(analyses, SkinAnalysis::getRednessScore),
                average(analyses, SkinAnalysis::getTroubleScore),
                average(analyses, SkinAnalysis::getDrynessScore),
                average(analyses, SkinAnalysis::getToneUniformityScore),
                average(analyses, SkinAnalysis::getOverallScore),
                average(analyses, SkinAnalysis::getConfidenceScore))));
        return result;
    }

    private double average(List<SkinAnalysis> analyses, ToIntFunction<SkinAnalysis> mapper) {
        return Math.round(analyses.stream().mapToInt(mapper).average().orElse(0) * 10.0) / 10.0;
    }

    private List<PersonalFactorAnalysisResponse> group(List<PersonalFactorAnalysisResult> results) {
        return results.stream()
                .collect(Collectors.groupingBy(PersonalFactorAnalysisResult::getFactorType,
                        () -> new EnumMap<>(FactorType.class), Collectors.toList()))
                .entrySet().stream()
                .map(entry -> toResponse(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingInt(this::rank).reversed()
                        .thenComparing(response -> response.factor().ordinal()))
                .toList();
    }

    private PersonalFactorAnalysisResponse toResponse(FactorType factor,
                                                       List<PersonalFactorAnalysisResult> results) {
        PersonalFactorAnalysisResult first = results.getFirst();
        List<FactorMetricAnalysisResponse> metrics = results.stream()
                .sorted(Comparator.comparing(PersonalFactorAnalysisResult::getTargetMetric))
                .map(FactorMetricAnalysisResponse::from)
                .toList();
        return new PersonalFactorAnalysisResponse(factor, first.getAnalyzedFrom(), first.getAnalyzedTo(),
                first.getCalculatedAt(), metrics, PersonalFactorAnalysisResponse.ASSOCIATION_NOTICE);
    }

    private int rank(PersonalFactorAnalysisResponse response) {
        return response.metrics().stream().mapToInt(metric -> {
            int status = metric.status() == FactorAnalysisStatus.ANALYZED ? 1000 : 0;
            int confidence = metric.confidenceLevel().ordinal() * 100;
            int difference = metric.observedDifference() == null ? 0
                    : (int) Math.round(Math.abs(metric.observedDifference()));
            return status + confidence + difference;
        }).max().orElse(0);
    }
}
