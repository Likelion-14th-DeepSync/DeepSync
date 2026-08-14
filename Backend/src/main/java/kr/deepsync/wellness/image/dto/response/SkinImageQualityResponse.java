package kr.deepsync.wellness.image.dto.response;

import kr.deepsync.wellness.image.domain.ImageQualityStatus;
import kr.deepsync.wellness.image.domain.SkinImageQuality;

import java.time.LocalDateTime;
import java.util.List;

public record SkinImageQualityResponse(
        Long qualityResultId,
        Long imageId,
        int resolutionScore,
        int lightingScore,
        int lightingUniformityScore,
        int sharpnessScore,
        int overallScore,
        ImageQualityStatus qualityStatus,
        List<String> messages,
        String modelVersion,
        LocalDateTime analyzedAt
) {
    public static SkinImageQualityResponse from(SkinImageQuality quality) {
        List<String> messages = quality.getFailureReasons().isBlank()
                ? List.of()
                : List.of(quality.getFailureReasons().split("\\|"));
        return new SkinImageQualityResponse(quality.getId(), quality.getSkinImage().getId(),
                quality.getResolutionScore(), quality.getLightingScore(), quality.getLightingUniformityScore(),
                quality.getSharpnessScore(), quality.getOverallScore(), quality.getQualityStatus(), messages,
                quality.getModelVersion(), quality.getAnalyzedAt());
    }
}
