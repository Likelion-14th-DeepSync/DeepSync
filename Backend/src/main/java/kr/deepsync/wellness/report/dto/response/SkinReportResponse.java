package kr.deepsync.wellness.report.dto.response;

import kr.deepsync.wellness.analysis.dto.response.InsightConfidenceResponse;
import kr.deepsync.wellness.dashboard.dto.response.DashboardExperimentResponse;
import kr.deepsync.wellness.report.domain.ReportType;

import java.time.LocalDateTime;
import java.util.List;

public record SkinReportResponse(
        ReportType reportType,
        ReportPeriodResponse displayPeriod,
        ReportPeriodResponse calculatedPeriod,
        ReportSkinSummaryResponse skin,
        ReportLifestyleSummaryResponse lifestyle,
        ReportEnvironmentSummaryResponse environment,
        List<ReportFactorResponse> topObservedFactors,
        String factorAnalysisNotice,
        DashboardExperimentResponse activeExperiment,
        List<ReportExperimentResponse> completedExperiments,
        InsightConfidenceResponse confidence,
        List<String> warnings,
        String notice,
        LocalDateTime generatedAt
) {
    public static final String FACTOR_NOTICE =
            "개인별 영향 요인은 최근 재계산된 통계 결과이며 해당 리포트 기간만의 결과가 아닐 수 있습니다.";
    public static final String NOTICE = "개인 기록을 기간별로 요약한 웰니스 정보이며 의료 진단이 아닙니다.";
}
