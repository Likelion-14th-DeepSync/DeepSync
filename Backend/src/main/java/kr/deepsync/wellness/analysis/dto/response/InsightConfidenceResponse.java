package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.AnalysisConfidenceLevel;

import java.time.LocalDateTime;

public record InsightConfidenceResponse(
        int score,
        AnalysisConfidenceLevel level,
        LocalDateTime calculatedAt
) {
}
