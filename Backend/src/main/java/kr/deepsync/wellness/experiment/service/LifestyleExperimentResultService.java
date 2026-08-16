package kr.deepsync.wellness.experiment.service;

import kr.deepsync.wellness.analysis.domain.SkinAnalysis;
import kr.deepsync.wellness.analysis.domain.SkinAnalysisStatus;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisRepository;
import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.experiment.domain.*;
import kr.deepsync.wellness.experiment.dto.response.ExperimentResultResponse;
import kr.deepsync.wellness.experiment.exception.ExperimentNotFoundException;
import kr.deepsync.wellness.experiment.repository.ExperimentDailyCheckRepository;
import kr.deepsync.wellness.experiment.repository.LifestyleExperimentRepository;
import kr.deepsync.wellness.experiment.repository.LifestyleExperimentResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LifestyleExperimentResultService {
    private final LifestyleExperimentRepository experimentRepository;
    private final LifestyleExperimentResultRepository resultRepository;
    private final ExperimentDailyCheckRepository checkRepository;
    private final SkinAnalysisRepository analysisRepository;
    private final ExperimentResultCalculator calculator;
    private final Clock clock;

    @Transactional
    public ExperimentResultResponse create(Long memberId, Long experimentId) {
        LifestyleExperiment experiment = findCompleted(memberId, experimentId);
        if (resultRepository.existsByExperimentId(experimentId)) {
            throw new BusinessException(ErrorCode.EXPERIMENT_RESULT_EXISTS);
        }
        LifestyleExperimentResult result = LifestyleExperimentResult.create(experiment, calculate(experiment));
        return ExperimentResultResponse.from(resultRepository.save(result));
    }

    public ExperimentResultResponse get(Long memberId, Long experimentId) {
        findExperiment(memberId, experimentId);
        return resultRepository.findByExperimentIdAndExperimentMemberId(experimentId, memberId)
                .map(ExperimentResultResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXPERIMENT_RESULT_NOT_FOUND));
    }

    @Transactional
    public ExperimentResultResponse recalculate(Long memberId, Long experimentId) {
        LifestyleExperiment experiment = findCompleted(memberId, experimentId);
        LifestyleExperimentResult result = resultRepository
                .findByExperimentIdAndExperimentMemberId(experimentId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXPERIMENT_RESULT_NOT_FOUND));
        result.update(calculate(experiment));
        return ExperimentResultResponse.from(result);
    }

    private ExperimentResultCalculation calculate(LifestyleExperiment experiment) {
        Long memberId = experiment.getMember().getId();
        List<SkinAnalysis> before = analysisRepository
                .findTop3BySkinImageMemberIdAndStatusAndSkinImageCapturedAtLessThanOrderBySkinImageCapturedAtDesc(
                        memberId, SkinAnalysisStatus.COMPLETED, experiment.getStartDate().atStartOfDay());
        List<SkinAnalysis> after = analysisRepository
                .findTop3BySkinImageMemberIdAndStatusAndSkinImageCapturedAtGreaterThanEqualAndSkinImageCapturedAtLessThanOrderBySkinImageCapturedAtDesc(
                        memberId, SkinAnalysisStatus.COMPLETED, experiment.getStartDate().atStartOfDay(),
                        experiment.getEndDate().plusDays(1).atStartOfDay());
        if (before.isEmpty() || after.isEmpty()) {
            throw new BusinessException(ErrorCode.EXPERIMENT_ANALYSIS_DATA_INSUFFICIENT);
        }
        List<ExperimentDailyCheck> checks = checkRepository
                .findAllByExperimentIdOrderByRecordDateAsc(experiment.getId());
        return calculator.calculate(experiment, checks, before, after, LocalDateTime.now(clock));
    }

    private LifestyleExperiment findCompleted(Long memberId, Long experimentId) {
        LifestyleExperiment experiment = findExperiment(memberId, experimentId);
        if (experiment.getStatus() != ExperimentStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.EXPERIMENT_RESULT_REQUIRES_COMPLETION);
        }
        return experiment;
    }

    private LifestyleExperiment findExperiment(Long memberId, Long experimentId) {
        return experimentRepository.findByIdAndMemberId(experimentId, memberId)
                .orElseThrow(ExperimentNotFoundException::new);
    }
}
