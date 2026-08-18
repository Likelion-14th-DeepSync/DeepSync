package kr.deepsync.wellness.analysis.api;

import kr.deepsync.wellness.analysis.dto.response.DailySkinInsightResponse;
import kr.deepsync.wellness.analysis.service.DailySkinInsightService;
import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.security.AuthenticatedMember;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/analysis")
public class DailySkinInsightApi {
    private final DailySkinInsightService service;

    @GetMapping("/today")
    public ApiResponse<DailySkinInsightResponse> today(
            @AuthenticationPrincipal AuthenticatedMember member) {
        return ApiResponse.success(service.getToday(member.memberId()));
    }

    @GetMapping("/daily")
    public ApiResponse<DailySkinInsightResponse> daily(
            @AuthenticationPrincipal AuthenticatedMember member,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success(service.get(member.memberId(), date));
    }
}
