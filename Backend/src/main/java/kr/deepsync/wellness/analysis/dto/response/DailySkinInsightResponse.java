package kr.deepsync.wellness.analysis.dto.response;

import java.time.LocalDate;
import java.util.List;

public record DailySkinInsightResponse(
        LocalDate analysisDate,
        DailySkinSnapshotResponse today,
        DailySkinChangesResponse changes,
        List<AssociatedFactorResponse> associatedFactors,
        InsightDataUsageResponse dataUsage,
        InsightConfidenceResponse confidence,
        List<String> warnings,
        String summary,
        String notice
) {
    public static final String NOTICE =
            "개인 기록에서 관찰된 변화에 대한 설명이며 의학적 진단이나 원인 판정이 아닙니다.";
}
