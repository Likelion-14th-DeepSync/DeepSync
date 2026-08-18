package kr.deepsync.wellness.dashboard.api;

import kr.deepsync.wellness.analysis.domain.AnalysisTimelinePeriod;
import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.dashboard.dto.response.DdayDashboardResponse;
import kr.deepsync.wellness.dashboard.service.DdayDashboardService;
import kr.deepsync.wellness.security.AuthenticatedMember;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/dashboard/dday")
public class DdayDashboardApi {
    private final DdayDashboardService service;

    @GetMapping
    public ApiResponse<DdayDashboardResponse> get(
            @AuthenticationPrincipal AuthenticatedMember member,
            @RequestParam(required = false) AnalysisTimelinePeriod period) {
        return ApiResponse.success(service.get(member.memberId(), period));
    }
}
