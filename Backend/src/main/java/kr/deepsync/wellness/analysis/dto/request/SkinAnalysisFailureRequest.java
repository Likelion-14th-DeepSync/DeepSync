package kr.deepsync.wellness.analysis.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SkinAnalysisFailureRequest(
        @NotBlank @Size(max = 500) String reason
) {
}
