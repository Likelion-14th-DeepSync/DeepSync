package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.SkinAnalysis;

import java.time.LocalDateTime;

public record SkinScoreSnapshot(
        Long analysisId,
        int rednessScore,
        int troubleScore,
        int drynessScore,
        int toneUniformityScore,
        int overallScore,
        LocalDateTime capturedAt
) {
    public static SkinScoreSnapshot from(SkinAnalysis analysis) {
        return new SkinScoreSnapshot(
                analysis.getId(), analysis.getRednessScore(), analysis.getTroubleScore(),
                analysis.getDrynessScore(), analysis.getToneUniformityScore(), analysis.getOverallScore(),
                analysis.getSkinImage().getCapturedAt()
        );
    }
}
