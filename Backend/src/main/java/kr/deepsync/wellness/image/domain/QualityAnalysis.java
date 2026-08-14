package kr.deepsync.wellness.image.domain;

import java.util.List;

public record QualityAnalysis(int resolutionScore, int lightingScore, int lightingUniformityScore,
                              int sharpnessScore, int overallScore, ImageQualityStatus status,
                              List<String> failureReasons, String modelVersion) {
}
