package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.SkinAnalysisBaseline;

import java.time.LocalDateTime;

public record SkinAnalysisBaselineResponse(
        Long baselineId,
        Long analysisId,
        Long imageId,
        int overallScore,
        LocalDateTime capturedAt,
        LocalDateTime selectedAt
) {
    public static SkinAnalysisBaselineResponse from(SkinAnalysisBaseline baseline) {
        return new SkinAnalysisBaselineResponse(
                baseline.getId(),
                baseline.getSkinAnalysis().getId(),
                baseline.getSkinAnalysis().getSkinImage().getId(),
                baseline.getSkinAnalysis().getOverallScore(),
                baseline.getSkinAnalysis().getSkinImage().getCapturedAt(),
                baseline.getSelectedAt()
        );
    }
}
