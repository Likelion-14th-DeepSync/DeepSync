package kr.deepsync.wellness.image.dto.request;

import jakarta.validation.constraints.NotNull;
import kr.deepsync.wellness.image.domain.FaceDirection;

import java.time.LocalDateTime;

public record SkinImageUploadRequest(
        @NotNull LocalDateTime capturedAt,
        @NotNull FaceDirection direction,
        @NotNull Boolean makeupApplied
) {
}
