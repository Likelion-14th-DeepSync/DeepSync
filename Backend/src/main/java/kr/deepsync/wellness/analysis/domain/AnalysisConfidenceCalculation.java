package kr.deepsync.wellness.analysis.domain;

import java.time.LocalDateTime;
import java.util.List;

public record AnalysisConfidenceCalculation(
        int score,
        AnalysisConfidenceLevel level,
        List<String> reasons,
        List<String> nextActions,
        LocalDateTime calculatedAt
) {
}
