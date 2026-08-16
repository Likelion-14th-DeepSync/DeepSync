package kr.deepsync.wellness.analysis.dto.response;

public record ConfidenceComponentResponse(
        int score,
        boolean available,
        String detail
) {
}
