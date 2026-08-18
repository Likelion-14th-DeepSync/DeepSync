package kr.deepsync.wellness.report.dto.response;

import java.time.LocalDate;

public record ReportPeriodResponse(LocalDate startDate, LocalDate endDate, int periodDays) {
}
