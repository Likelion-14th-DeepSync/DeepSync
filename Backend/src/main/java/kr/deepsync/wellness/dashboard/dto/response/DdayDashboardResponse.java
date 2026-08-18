package kr.deepsync.wellness.dashboard.dto.response;

import kr.deepsync.wellness.analysis.dto.response.AnalysisConfidenceResponse;
import kr.deepsync.wellness.analysis.dto.response.DailySkinInsightResponse;
import kr.deepsync.wellness.analysis.dto.response.SkinAnalysisTimelineResponse;
import kr.deepsync.wellness.dday.dto.response.SkinGoalResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record DdayDashboardResponse(
        LocalDate dashboardDate,
        SkinGoalResponse goal,
        DailySkinInsightResponse skinInsight,
        DashboardExperimentResponse activeExperiment,
        DashboardEnvironmentResponse environment,
        SkinAnalysisTimelineResponse timeline,
        AnalysisConfidenceResponse confidence,
        DashboardRoutineResponse routine,
        List<String> warnings,
        LocalDateTime generatedAt
) {
}
