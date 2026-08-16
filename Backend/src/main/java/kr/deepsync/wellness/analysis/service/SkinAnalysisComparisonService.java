package kr.deepsync.wellness.analysis.service;

import kr.deepsync.wellness.analysis.domain.AnalysisTimelinePeriod;
import kr.deepsync.wellness.analysis.domain.SkinAnalysis;
import kr.deepsync.wellness.analysis.domain.SkinAnalysisBaseline;
import kr.deepsync.wellness.analysis.domain.SkinAnalysisStatus;
import kr.deepsync.wellness.analysis.dto.response.SkinAnalysisBaselineResponse;
import kr.deepsync.wellness.analysis.dto.response.SkinAnalysisComparisonResponse;
import kr.deepsync.wellness.analysis.dto.response.SkinAnalysisTimelineResponse;
import kr.deepsync.wellness.analysis.dto.response.SkinScoreChange;
import kr.deepsync.wellness.analysis.dto.response.SkinScoreSnapshot;
import kr.deepsync.wellness.analysis.exception.SkinAnalysisNotFoundException;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisBaselineRepository;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisRepository;
import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
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
public class SkinAnalysisComparisonService {
    private final SkinAnalysisRepository analysisRepository;
    private final SkinAnalysisBaselineRepository baselineRepository;
    private final Clock clock;

    @Transactional
    public void initializeBaselineIfAbsent(SkinAnalysis analysis) {
        Long memberId = analysis.getSkinImage().getMember().getId();
        if (baselineRepository.findByMemberId(memberId).isEmpty()) {
            baselineRepository.save(SkinAnalysisBaseline.create(
                    analysis.getSkinImage().getMember(), analysis, LocalDateTime.now(clock)));
        }
    }

    @Transactional
    public SkinAnalysisBaselineResponse setBaseline(Long memberId, Long analysisId) {
        SkinAnalysis analysis = findCompleted(memberId, analysisId);
        LocalDateTime selectedAt = LocalDateTime.now(clock);
        SkinAnalysisBaseline baseline = baselineRepository.findByMemberId(memberId)
                .map(existing -> {
                    existing.change(analysis, selectedAt);
                    return existing;
                })
                .orElseGet(() -> SkinAnalysisBaseline.create(
                        analysis.getSkinImage().getMember(), analysis, selectedAt));
        return SkinAnalysisBaselineResponse.from(baselineRepository.save(baseline));
    }

    @Transactional
    public SkinAnalysisBaselineResponse getBaseline(Long memberId) {
        return SkinAnalysisBaselineResponse.from(resolveBaseline(memberId));
    }

    @Transactional
    public SkinAnalysisComparisonResponse compare(Long memberId, Long analysisId) {
        SkinAnalysis current = findCompleted(memberId, analysisId);
        SkinAnalysis baseline = resolveBaseline(memberId).getSkinAnalysis();
        SkinAnalysis previous = analysisRepository
                .findFirstBySkinImageMemberIdAndStatusAndSkinImageCapturedAtLessThanOrderBySkinImageCapturedAtDesc(
                        memberId, SkinAnalysisStatus.COMPLETED, current.getSkinImage().getCapturedAt())
                .orElse(null);

        return new SkinAnalysisComparisonResponse(
                SkinScoreSnapshot.from(current),
                SkinScoreChange.between(current, baseline),
                previous == null ? null : SkinScoreChange.between(current, previous)
        );
    }

    public SkinAnalysisTimelineResponse getTimeline(Long memberId, AnalysisTimelinePeriod period) {
        LocalDate endDate = LocalDate.now(clock);
        LocalDate startDate = endDate.minusDays(period.getDays() - 1L);
        List<SkinScoreSnapshot> analyses = analysisRepository
                .findAllBySkinImageMemberIdAndStatusAndSkinImageCapturedAtGreaterThanEqualAndSkinImageCapturedAtLessThanOrderBySkinImageCapturedAtAsc(
                        memberId, SkinAnalysisStatus.COMPLETED, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay())
                .stream()
                .map(SkinScoreSnapshot::from)
                .toList();
        return new SkinAnalysisTimelineResponse(period, startDate, endDate, analyses.size(), analyses);
    }

    private SkinAnalysis findCompleted(Long memberId, Long analysisId) {
        SkinAnalysis analysis = analysisRepository.findByIdAndSkinImageMemberId(analysisId, memberId)
                .orElseThrow(SkinAnalysisNotFoundException::new);
        if (analysis.getStatus() != SkinAnalysisStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.SKIN_ANALYSIS_NOT_COMPLETED);
        }
        return analysis;
    }

    private SkinAnalysisBaseline resolveBaseline(Long memberId) {
        return baselineRepository.findByMemberId(memberId).orElseGet(() -> {
            SkinAnalysis first = analysisRepository
                    .findFirstBySkinImageMemberIdAndStatusOrderBySkinImageCapturedAtAsc(
                            memberId, SkinAnalysisStatus.COMPLETED)
                    .orElseThrow(() -> new BusinessException(ErrorCode.SKIN_ANALYSIS_BASELINE_NOT_FOUND));
            return baselineRepository.save(SkinAnalysisBaseline.create(
                    first.getSkinImage().getMember(), first, LocalDateTime.now(clock)));
        });
    }
}
