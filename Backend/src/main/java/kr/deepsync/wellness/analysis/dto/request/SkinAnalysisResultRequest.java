package kr.deepsync.wellness.analysis.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SkinAnalysisResultRequest(
        @Min(0) @Max(100) int rednessScore,
        @Min(0) @Max(100) int troubleScore,
        @Min(0) @Max(100) int drynessScore,
        @Min(0) @Max(100) int toneUniformityScore,
        @Min(0) @Max(100) int overallScore,
        @Min(0) @Max(100) int confidenceScore,
        @NotBlank @Size(max = 100) String modelVersion
) {
}
