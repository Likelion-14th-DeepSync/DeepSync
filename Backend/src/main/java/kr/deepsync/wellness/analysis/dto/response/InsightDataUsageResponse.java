package kr.deepsync.wellness.analysis.dto.response;

import java.util.List;

public record InsightDataUsageResponse(
        List<InsightDataItemResponse> usedData,
        List<InsightDataItemResponse> excludedData
) {
}
