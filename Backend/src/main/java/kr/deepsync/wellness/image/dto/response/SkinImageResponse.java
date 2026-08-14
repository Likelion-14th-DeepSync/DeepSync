package kr.deepsync.wellness.image.dto.response;

import kr.deepsync.wellness.image.domain.FaceDirection;
import kr.deepsync.wellness.image.domain.ImageQualityStatus;
import kr.deepsync.wellness.image.domain.SkinImage;

import java.time.LocalDateTime;

public record SkinImageResponse(
        Long imageId,
        String imageUrl,
        LocalDateTime capturedAt,
        FaceDirection direction,
        boolean makeupApplied,
        String contentType,
        long fileSize,
        ImageQualityStatus qualityStatus,
        LocalDateTime createdAt
) {
    public static SkinImageResponse from(SkinImage image) {
        return new SkinImageResponse(image.getId(), "/api/v1/skin-images/" + image.getId() + "/file",
                image.getCapturedAt(), image.getDirection(), image.isMakeupApplied(), image.getContentType(),
                image.getFileSize(), image.getQualityStatus(), image.getCreatedAt());
    }
}
