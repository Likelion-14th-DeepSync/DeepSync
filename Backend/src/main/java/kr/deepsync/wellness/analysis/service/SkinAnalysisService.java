package kr.deepsync.wellness.analysis.service;

import kr.deepsync.wellness.analysis.domain.SkinAnalysis;
import kr.deepsync.wellness.analysis.domain.SkinAnalysisStatus;
import kr.deepsync.wellness.analysis.dto.request.SkinAnalysisFailureRequest;
import kr.deepsync.wellness.analysis.dto.request.SkinAnalysisResultRequest;
import kr.deepsync.wellness.analysis.dto.response.SkinAnalysisResponse;
import kr.deepsync.wellness.analysis.exception.SkinAnalysisNotFoundException;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisRepository;
import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.image.domain.ImageQualityStatus;
import kr.deepsync.wellness.image.domain.SkinImage;
import kr.deepsync.wellness.image.exception.SkinImageNotFoundException;
import kr.deepsync.wellness.image.repository.SkinImageRepository;
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
public class SkinAnalysisService {
    private final SkinAnalysisRepository repository;
    private final SkinImageRepository imageRepository;
    private final Clock clock;

    @Transactional
    public SkinAnalysisResponse request(Long memberId, Long imageId) {
        SkinImage image = findImage(memberId, imageId);
        validateImageQuality(image);

        SkinAnalysis analysis = repository.findBySkinImageIdAndSkinImageMemberId(imageId, memberId)
                .map(existing -> {
                    if (existing.getStatus() == SkinAnalysisStatus.COMPLETED) {
                        throw new BusinessException(ErrorCode.SKIN_ANALYSIS_ALREADY_COMPLETED);
                    }
                    if (existing.getStatus() != SkinAnalysisStatus.FAILED) {
                        throw new BusinessException(ErrorCode.SKIN_ANALYSIS_IN_PROGRESS);
                    }
                    existing.retry();
                    return existing;
                })
                .orElseGet(() -> SkinAnalysis.request(image));
        return SkinAnalysisResponse.from(repository.save(analysis));
    }

    @Transactional
    public SkinAnalysisResponse start(Long memberId, Long analysisId) {
        SkinAnalysis analysis = find(memberId, analysisId);
        if (analysis.getStatus() != SkinAnalysisStatus.PENDING) {
            throw new BusinessException(ErrorCode.SKIN_ANALYSIS_NOT_PENDING);
        }
        analysis.startProcessing();
        return SkinAnalysisResponse.from(analysis);
    }

    @Transactional
    public SkinAnalysisResponse complete(Long memberId, Long analysisId, SkinAnalysisResultRequest request) {
        SkinAnalysis analysis = findProcessing(memberId, analysisId);
        analysis.complete(request, LocalDateTime.now(clock));
        return SkinAnalysisResponse.from(analysis);
    }

    @Transactional
    public SkinAnalysisResponse fail(Long memberId, Long analysisId, SkinAnalysisFailureRequest request) {
        SkinAnalysis analysis = findProcessing(memberId, analysisId);
        analysis.fail(request.reason(), LocalDateTime.now(clock));
        return SkinAnalysisResponse.from(analysis);
    }

    public SkinAnalysisResponse get(Long memberId, Long analysisId) {
        return SkinAnalysisResponse.from(find(memberId, analysisId));
    }

    public SkinAnalysisResponse getByImage(Long memberId, Long imageId) {
        findImage(memberId, imageId);
        return repository.findBySkinImageIdAndSkinImageMemberId(imageId, memberId)
                .map(SkinAnalysisResponse::from)
                .orElseThrow(SkinAnalysisNotFoundException::new);
    }

    public SkinAnalysisResponse getLatestCompleted(Long memberId) {
        return repository.findFirstBySkinImageMemberIdAndStatusOrderBySkinImageCapturedAtDesc(
                        memberId, SkinAnalysisStatus.COMPLETED)
                .map(SkinAnalysisResponse::from)
                .orElseThrow(SkinAnalysisNotFoundException::new);
    }

    public List<SkinAnalysisResponse> getRange(Long memberId, LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new BusinessException(ErrorCode.INVALID_DATE_RANGE);
        }
        return repository
                .findAllBySkinImageMemberIdAndSkinImageCapturedAtGreaterThanEqualAndSkinImageCapturedAtLessThanOrderBySkinImageCapturedAtDesc(
                        memberId, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay())
                .stream()
                .map(SkinAnalysisResponse::from)
                .toList();
    }

    private SkinAnalysis findProcessing(Long memberId, Long analysisId) {
        SkinAnalysis analysis = find(memberId, analysisId);
        if (analysis.getStatus() != SkinAnalysisStatus.PROCESSING) {
            throw new BusinessException(ErrorCode.SKIN_ANALYSIS_NOT_PROCESSING);
        }
        return analysis;
    }

    private SkinAnalysis find(Long memberId, Long analysisId) {
        return repository.findByIdAndSkinImageMemberId(analysisId, memberId)
                .orElseThrow(SkinAnalysisNotFoundException::new);
    }

    private SkinImage findImage(Long memberId, Long imageId) {
        return imageRepository.findByIdAndMemberId(imageId, memberId)
                .orElseThrow(SkinImageNotFoundException::new);
    }

    private void validateImageQuality(SkinImage image) {
        if (image.getQualityStatus() == ImageQualityStatus.PENDING) {
            throw new BusinessException(ErrorCode.IMAGE_QUALITY_CHECK_REQUIRED);
        }
        if (image.getQualityStatus() != ImageQualityStatus.PASSED) {
            throw new BusinessException(ErrorCode.IMAGE_QUALITY_NOT_ACCEPTED);
        }
    }
}
