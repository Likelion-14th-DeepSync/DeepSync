package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.AnalysisConfidenceLevel;
import kr.deepsync.wellness.analysis.domain.AnalysisConfidenceResult;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;

public record AnalysisConfidenceResponse(
        int score,
        AnalysisConfidenceLevel level,
        LocalDate analyzedFrom,
        LocalDate analyzedTo,
        int periodDays,
        ConfidenceComponentsResponse components,
        List<String> reasons,
        List<String> nextActions,
        LocalDateTime calculatedAt
) {
    public static AnalysisConfidenceResponse from(AnalysisConfidenceResult result) {
        int periodDays = (int) ChronoUnit.DAYS.between(result.getAnalyzedFrom(), result.getAnalyzedTo()) + 1;
        return new AnalysisConfidenceResponse(result.getScore(), result.getConfidenceLevel(),
                result.getAnalyzedFrom(), result.getAnalyzedTo(), periodDays,
                ConfidenceComponentsResponse.from(result, periodDays), split(result.getReasons()),
                split(result.getNextActions()), result.getCalculatedAt());
    }

    private static List<String> split(String value) {
        return value.isBlank() ? List.of() : Arrays.asList(value.split("\\|"));
    }
}
