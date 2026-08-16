package kr.deepsync.wellness.analysis.service;

import kr.deepsync.wellness.analysis.domain.*;
import kr.deepsync.wellness.analysis.dto.response.AnalysisConfidenceResponse;
import kr.deepsync.wellness.analysis.repository.AnalysisConfidenceResultRepository;
import kr.deepsync.wellness.analysis.repository.PersonalFactorAnalysisResultRepository;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisRepository;
import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.environment.repository.EnvironmentRecordRepository;
import kr.deepsync.wellness.experiment.domain.ExperimentConfidenceLevel;
import kr.deepsync.wellness.experiment.domain.LifestyleExperimentResult;
import kr.deepsync.wellness.experiment.repository.LifestyleExperimentResultRepository;
import kr.deepsync.wellness.image.domain.SkinImageQuality;
import kr.deepsync.wellness.image.repository.SkinImageQualityRepository;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalysisConfidenceService {
    private static final int DEFAULT_PERIOD_DAYS = 30;
    private static final int MIN_PERIOD_DAYS = 7;
    private static final int MAX_PERIOD_DAYS = 90;

    private final AnalysisConfidenceResultRepository resultRepository;
    private final SkinAnalysisRepository skinAnalysisRepository;
    private final SkinImageQualityRepository qualityRepository;
    private final LifestyleRecordRepository lifestyleRepository;
    private final EnvironmentRecordRepository environmentRepository;
    private final PersonalFactorAnalysisResultRepository factorRepository;
    private final LifestyleExperimentResultRepository experimentResultRepository;
    private final MemberRepository memberRepository;
    private final AnalysisConfidenceCalculator calculator;
    private final Clock clock;

    @Transactional
    public AnalysisConfidenceResponse recalculate(Long memberId, Integer requestedPeriodDays) {
        int periodDays = requestedPeriodDays == null ? DEFAULT_PERIOD_DAYS : requestedPeriodDays;
        if (periodDays < MIN_PERIOD_DAYS || periodDays > MAX_PERIOD_DAYS) {
            throw new BusinessException(ErrorCode.INVALID_CONFIDENCE_ANALYSIS_PERIOD);
        }
        Member member = memberRepository.findById(memberId).orElseThrow(MemberNotFoundException::new);
        LocalDate analyzedTo = LocalDate.now(clock);
        LocalDate analyzedFrom = analyzedTo.minusDays(periodDays - 1L);
        LocalDateTime start = analyzedFrom.atStartOfDay();
        LocalDateTime end = analyzedTo.plusDays(1).atStartOfDay();

        List<SkinAnalysis> skinAnalyses = skinAnalysisRepository
                .findAllBySkinImageMemberIdAndSkinImageCapturedAtGreaterThanEqualAndSkinImageCapturedAtLessThanOrderBySkinImageCapturedAtDesc(
                        memberId, start, end).stream()
                .filter(value -> value.getStatus() == SkinAnalysisStatus.COMPLETED).toList();
        int skinRecordedDays = (int) skinAnalyses.stream()
                .map(value -> value.getSkinImage().getCapturedAt().toLocalDate()).distinct().count();
        int skinCoverage = percent(skinRecordedDays, periodDays);

        List<SkinImageQuality> qualities = qualityRepository
                .findAllBySkinImageMemberIdAndSkinImageCapturedAtGreaterThanEqualAndSkinImageCapturedAtLessThan(
                        memberId, start, end);
        int imageQualityScore = roundedAverage(qualities.stream().mapToInt(SkinImageQuality::getOverallScore).toArray());

        List<LifestyleRecord> lifestyleRecords = lifestyleRepository
                .findAllByMemberIdAndRecordDateBetweenOrderByRecordDateAsc(memberId, analyzedFrom, analyzedTo);
        int lifestyleFields = lifestyleRecords.stream().mapToInt(this::completedLifestyleFields).sum();
        int lifestyleCompleteness = percent(lifestyleFields, periodDays * 4);

        List<EnvironmentRecord> environmentRecords = environmentRepository
                .findAllByMemberIdAndRecordDateBetweenOrderByRecordDateAsc(memberId, analyzedFrom, analyzedTo);
        int environmentFields = environmentRecords.stream().mapToInt(this::completedEnvironmentFields).sum();
        int environmentCompleteness = percent(environmentFields, periodDays * 4);

        List<PersonalFactorAnalysisResult> analyzedFactors = factorRepository.findAllByMemberId(memberId).stream()
                .filter(value -> value.getAnalysisStatus() == FactorAnalysisStatus.ANALYZED).toList();
        int repeatedScore = analyzedFactors.isEmpty() ? 0 : (int) Math.round(analyzedFactors.stream()
                .mapToInt(value -> Math.min(value.getExposedCount(), value.getNormalCount()))
                .map(value -> Math.min(100, (int) Math.round(value * 100.0 / 7)))
                .average().orElse(0));

        List<LifestyleExperimentResult> experimentResults = experimentResultRepository
                .findAllByExperimentMemberId(memberId);
        int experimentScore = experimentResults.isEmpty() ? 0 : (int) Math.round(experimentResults.stream()
                .mapToInt(value -> evidenceScore(value.getConfidenceLevel())).average().orElse(0));

        int modelConfidenceScore = roundedAverage(skinAnalyses.stream()
                .mapToInt(SkinAnalysis::getConfidenceScore).toArray());
        AnalysisConfidenceEvidence evidence = new AnalysisConfidenceEvidence(periodDays,
                imageQualityScore, !qualities.isEmpty(), skinCoverage, lifestyleCompleteness,
                environmentCompleteness, repeatedScore, !analyzedFactors.isEmpty(), experimentScore,
                !experimentResults.isEmpty(), modelConfidenceScore, !skinAnalyses.isEmpty(),
                skinRecordedDays, analyzedFrom, analyzedTo);
        AnalysisConfidenceCalculation calculation = calculator.calculate(evidence, LocalDateTime.now(clock));
        AnalysisConfidenceResult result = resultRepository.findByMemberId(memberId)
                .map(existing -> {
                    existing.update(evidence, calculation);
                    return existing;
                })
                .orElseGet(() -> AnalysisConfidenceResult.create(member, evidence, calculation));
        return AnalysisConfidenceResponse.from(resultRepository.save(result));
    }

    public AnalysisConfidenceResponse get(Long memberId) {
        return resultRepository.findByMemberId(memberId)
                .map(AnalysisConfidenceResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.ANALYSIS_CONFIDENCE_NOT_FOUND));
    }

    private int completedLifestyleFields(LifestyleRecord record) {
        int count = 0;
        if (record.getSleepDurationMinutes() != null) count++;
        if (record.getBedtime() != null) count++;
        if (record.getLateNightMeal() != null) count++;
        if (record.getWaterIntakeMl() != null) count++;
        return count;
    }

    private int completedEnvironmentFields(EnvironmentRecord record) {
        int count = 0;
        if (record.getUvIndex() != null) count++;
        if (record.getTemperature() != null) count++;
        if (record.getHumidity() != null) count++;
        if (record.getFineDust() != null) count++;
        return count;
    }

    private int evidenceScore(ExperimentConfidenceLevel level) {
        return switch (level) {
            case LOW -> 35;
            case MEDIUM -> 70;
            case HIGH -> 100;
        };
    }

    private int percent(int value, int total) {
        return total == 0 ? 0 : Math.min(100, (int) Math.round(value * 100.0 / total));
    }

    private int roundedAverage(int[] values) {
        if (values.length == 0) return 0;
        long sum = 0;
        for (int value : values) sum += value;
        return (int) Math.round((double) sum / values.length);
    }
}
