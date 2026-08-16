package kr.deepsync.wellness.analysis.api;

import kr.deepsync.wellness.analysis.dto.response.AnalysisConfidenceResponse;
import kr.deepsync.wellness.analysis.service.AnalysisConfidenceService;
import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.security.AuthenticatedMember;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/analysis/confidence")
public class AnalysisConfidenceApi {
    private final AnalysisConfidenceService service;

    @PostMapping("/recalculate")
    public ApiResponse<AnalysisConfidenceResponse> recalculate(
            @AuthenticationPrincipal AuthenticatedMember member,
            @RequestParam(required = false) Integer periodDays) {
        return ApiResponse.success(service.recalculate(member.memberId(), periodDays));
    }

    @GetMapping
    public ApiResponse<AnalysisConfidenceResponse> get(
            @AuthenticationPrincipal AuthenticatedMember member) {
        return ApiResponse.success(service.get(member.memberId()));
    }
}
