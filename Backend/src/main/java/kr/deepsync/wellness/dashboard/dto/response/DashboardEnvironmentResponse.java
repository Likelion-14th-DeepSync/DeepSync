package kr.deepsync.wellness.dashboard.dto.response;

import kr.deepsync.wellness.environment.dto.response.EnvironmentRecordResponse;

import java.util.List;

public record DashboardEnvironmentResponse(
        boolean available,
        EnvironmentRecordResponse record,
        List<EnvironmentRiskResponse> risks
) {
}
