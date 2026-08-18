package kr.deepsync.wellness.report.dto.response;

import kr.deepsync.wellness.analysis.domain.TargetSkinMetric;

public record ReportMetricChangeResponse(TargetSkinMetric metric, double change) {
}
