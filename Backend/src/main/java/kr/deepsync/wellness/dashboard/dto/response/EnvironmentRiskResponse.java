package kr.deepsync.wellness.dashboard.dto.response;

public record EnvironmentRiskResponse(
        String type,
        String value,
        String message
) {
}
