package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.SkinAnalysis;
import kr.deepsync.wellness.analysis.domain.SkinAnalysisStatus;

import java.time.LocalDateTime;

public record SkinAnalysisResponse(
        Long analysisId,
        Long imageId,
        SkinAnalysisStatus status,
        Integer rednessScore,
        Integer troubleScore,
        Integer drynessScore,
        Integer toneUniformityScore,
        Integer overallScore,
        Integer confidenceScore,
        String modelVersion,
        String failureReason,
        LocalDateTime capturedAt,
        LocalDateTime analyzedAt,
        LocalDateTime requestedAt
) {
    public static SkinAnalysisResponse from(SkinAnalysis analysis) {
        return new SkinAnalysisResponse(
                analysis.getId(),
                analysis.getSkinImage().getId(),
                analysis.getStatus(),
                analysis.getRednessScore(),
                analysis.getTroubleScore(),
                analysis.getDrynessScore(),
                analysis.getToneUniformityScore(),
                analysis.getOverallScore(),
                analysis.getConfidenceScore(),
                analysis.getModelVersion(),
                analysis.getFailureReason(),
                analysis.getSkinImage().getCapturedAt(),
                analysis.getAnalyzedAt(),
                analysis.getCreatedAt()
        );
    }
}
