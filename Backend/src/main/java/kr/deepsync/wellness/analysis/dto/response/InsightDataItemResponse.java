package kr.deepsync.wellness.analysis.dto.response;

import java.time.LocalDate;

public record InsightDataItemResponse(
        String type,
        String field,
        LocalDate date,
        String description
) {
}
