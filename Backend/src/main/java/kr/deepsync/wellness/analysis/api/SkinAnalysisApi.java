package kr.deepsync.wellness.analysis.api;

import jakarta.validation.Valid;
import kr.deepsync.wellness.analysis.dto.request.SkinAnalysisFailureRequest;
import kr.deepsync.wellness.analysis.dto.request.SkinAnalysisResultRequest;
import kr.deepsync.wellness.analysis.dto.response.SkinAnalysisResponse;
import kr.deepsync.wellness.analysis.service.SkinAnalysisService;
import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.security.AuthenticatedMember;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class SkinAnalysisApi {
    private final SkinAnalysisService service;

    @PostMapping("/skin-images/{imageId}/analyses")
    public ResponseEntity<ApiResponse<SkinAnalysisResponse>> request(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long imageId) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success(service.request(member.memberId(), imageId)));
    }

    @GetMapping("/skin-images/{imageId}/analysis")
    public ApiResponse<SkinAnalysisResponse> getByImage(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long imageId) {
        return ApiResponse.success(service.getByImage(member.memberId(), imageId));
    }

    @PatchMapping("/skin-analyses/{analysisId}/start")
    public ApiResponse<SkinAnalysisResponse> start(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long analysisId) {
        return ApiResponse.success(service.start(member.memberId(), analysisId));
    }

    @PatchMapping("/skin-analyses/{analysisId}/result")
    public ApiResponse<SkinAnalysisResponse> complete(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long analysisId,
            @Valid @RequestBody SkinAnalysisResultRequest request) {
        return ApiResponse.success(service.complete(member.memberId(), analysisId, request));
    }

    @PatchMapping("/skin-analyses/{analysisId}/failure")
    public ApiResponse<SkinAnalysisResponse> fail(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long analysisId,
            @Valid @RequestBody SkinAnalysisFailureRequest request) {
        return ApiResponse.success(service.fail(member.memberId(), analysisId, request));
    }

    @GetMapping("/skin-analyses/{analysisId}")
    public ApiResponse<SkinAnalysisResponse> get(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long analysisId) {
        return ApiResponse.success(service.get(member.memberId(), analysisId));
    }

    @GetMapping("/skin-analyses/latest")
    public ApiResponse<SkinAnalysisResponse> getLatest(
            @AuthenticationPrincipal AuthenticatedMember member) {
        return ApiResponse.success(service.getLatestCompleted(member.memberId()));
    }

    @GetMapping("/skin-analyses")
    public ApiResponse<List<SkinAnalysisResponse>> getRange(
            @AuthenticationPrincipal AuthenticatedMember member,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.success(service.getRange(member.memberId(), startDate, endDate));
    }
}
