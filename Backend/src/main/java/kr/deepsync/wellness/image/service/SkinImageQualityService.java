package kr.deepsync.wellness.image.service;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.image.domain.QualityAnalysis;
import kr.deepsync.wellness.image.domain.SkinImage;
import kr.deepsync.wellness.image.domain.SkinImageQuality;
import kr.deepsync.wellness.image.dto.response.SkinImageQualityResponse;
import kr.deepsync.wellness.image.exception.SkinImageNotFoundException;
import kr.deepsync.wellness.image.repository.SkinImageQualityRepository;
import kr.deepsync.wellness.image.repository.SkinImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SkinImageQualityService {
    private final SkinImageRepository imageRepository;
    private final SkinImageQualityRepository qualityRepository;
    private final ImageStorage storage;
    private final ImageQualityAnalyzer analyzer;
    private final Clock clock;

    @Transactional
    public SkinImageQualityResponse analyze(Long memberId, Long imageId) {
        SkinImage image = findImage(memberId, imageId);
        QualityAnalysis result = analyzer.analyze(storage.load(image.getStorageKey()));
        LocalDateTime analyzedAt = LocalDateTime.now(clock);
        SkinImageQuality quality = qualityRepository.findBySkinImageId(imageId)
                .map(existing -> {
                    existing.update(result, analyzedAt);
                    return existing;
                })
                .orElseGet(() -> SkinImageQuality.create(image, result, analyzedAt));
        image.updateQualityStatus(result.status());
        return SkinImageQualityResponse.from(qualityRepository.save(quality));
    }

    public SkinImageQualityResponse get(Long memberId, Long imageId) {
        findImage(memberId, imageId);
        return qualityRepository.findBySkinImageIdAndSkinImageMemberId(imageId, memberId)
                .map(SkinImageQualityResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.IMAGE_QUALITY_NOT_FOUND));
    }

    private SkinImage findImage(Long memberId, Long imageId) {
        return imageRepository.findByIdAndMemberId(imageId, memberId)
                .orElseThrow(SkinImageNotFoundException::new);
    }
}
