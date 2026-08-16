package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.SkinAnalysis;

public record SkinScoreChange(
        Long comparedAnalysisId,
        int rednessScoreChange,
        int troubleScoreChange,
        int drynessScoreChange,
        int toneUniformityScoreChange,
        int overallScoreChange
) {
    public static SkinScoreChange between(SkinAnalysis current, SkinAnalysis compared) {
        return new SkinScoreChange(
                compared.getId(),
                current.getRednessScore() - compared.getRednessScore(),
                current.getTroubleScore() - compared.getTroubleScore(),
                current.getDrynessScore() - compared.getDrynessScore(),
                current.getToneUniformityScore() - compared.getToneUniformityScore(),
                current.getOverallScore() - compared.getOverallScore()
        );
    }
}
