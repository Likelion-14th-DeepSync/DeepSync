package kr.deepsync.wellness.analysis.dto.response;

public record SkinAnalysisComparisonResponse(
        SkinScoreSnapshot current,
        SkinScoreChange baselineComparison,
        SkinScoreChange previousComparison
) {
}
