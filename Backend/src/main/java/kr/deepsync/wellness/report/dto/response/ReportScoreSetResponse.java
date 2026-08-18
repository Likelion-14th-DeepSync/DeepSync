package kr.deepsync.wellness.report.dto.response;

public record ReportScoreSetResponse(
        Double redness,
        Double trouble,
        Double dryness,
        Double toneUniformity,
        Double overall
) {
}
