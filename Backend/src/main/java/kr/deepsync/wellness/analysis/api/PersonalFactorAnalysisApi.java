package kr.deepsync.wellness.analysis.api;

import kr.deepsync.wellness.analysis.domain.FactorType;
import kr.deepsync.wellness.analysis.dto.response.PersonalFactorAnalysisResponse;
import kr.deepsync.wellness.analysis.service.PersonalFactorAnalysisService;
import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.security.AuthenticatedMember;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/analysis/factors")
public class PersonalFactorAnalysisApi {
    private final PersonalFactorAnalysisService service;

    @PostMapping("/recalculate")
    public ApiResponse<List<PersonalFactorAnalysisResponse>> recalculate(
            @AuthenticationPrincipal AuthenticatedMember member,
            @RequestParam(required = false) Integer periodDays) {
        return ApiResponse.success(service.recalculate(member.memberId(), periodDays));
    }

    @GetMapping
    public ApiResponse<List<PersonalFactorAnalysisResponse>> getAll(
            @AuthenticationPrincipal AuthenticatedMember member) {
        return ApiResponse.success(service.getAll(member.memberId()));
    }

    @GetMapping("/{factor}")
    public ApiResponse<PersonalFactorAnalysisResponse> get(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable FactorType factor) {
        return ApiResponse.success(service.get(member.memberId(), factor));
    }
}
