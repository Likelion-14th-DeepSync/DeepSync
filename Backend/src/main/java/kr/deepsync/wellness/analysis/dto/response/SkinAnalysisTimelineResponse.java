package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.AnalysisTimelinePeriod;

import java.time.LocalDate;
import java.util.List;

public record SkinAnalysisTimelineResponse(
        AnalysisTimelinePeriod period,
        LocalDate startDate,
        LocalDate endDate,
        int analysisCount,
        List<SkinScoreSnapshot> analyses
) {
}
