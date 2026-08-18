package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.SkinAnalysis;

import java.time.LocalDateTime;

public record DailySkinSnapshotResponse(
        Long analysisId,
        Long imageId,
        LocalDateTime capturedAt,
        int overallScore,
        int rednessScore,
        int troubleScore,
        int drynessScore,
        int toneUniformityScore,
        int modelConfidenceScore
) {
    public static DailySkinSnapshotResponse from(SkinAnalysis analysis) {
        return new DailySkinSnapshotResponse(analysis.getId(), analysis.getSkinImage().getId(),
                analysis.getSkinImage().getCapturedAt(), analysis.getOverallScore(), analysis.getRednessScore(),
                analysis.getTroubleScore(), analysis.getDrynessScore(), analysis.getToneUniformityScore(),
                analysis.getConfidenceScore());
    }
}
