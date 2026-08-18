package kr.deepsync.wellness.report.api;

import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.report.dto.response.SkinReportResponse;
import kr.deepsync.wellness.report.service.SkinReportService;
import kr.deepsync.wellness.security.AuthenticatedMember;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reports")
public class SkinReportApi {
    private final SkinReportService service;

    @GetMapping("/weekly")
    public ApiResponse<SkinReportResponse> weekly(
            @AuthenticationPrincipal AuthenticatedMember member,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success(service.weekly(member.memberId(), date));
    }

    @GetMapping("/monthly")
    public ApiResponse<SkinReportResponse> monthly(
            @AuthenticationPrincipal AuthenticatedMember member,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ApiResponse.success(service.monthly(member.memberId(), year, month));
    }
}
