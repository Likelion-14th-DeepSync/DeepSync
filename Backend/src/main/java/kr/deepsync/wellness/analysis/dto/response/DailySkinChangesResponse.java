package kr.deepsync.wellness.analysis.dto.response;

public record DailySkinChangesResponse(
        SkinScoreChange baseline,
        SkinScoreChange previous,
        LargestSkinChangeResponse largestChange
) {
}
