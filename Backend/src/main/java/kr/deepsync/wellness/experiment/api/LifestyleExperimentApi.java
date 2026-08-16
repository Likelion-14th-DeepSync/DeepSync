package kr.deepsync.wellness.experiment.api;

import jakarta.validation.Valid;
import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.experiment.dto.request.CreateExperimentRequest;
import kr.deepsync.wellness.experiment.dto.request.DailyCheckRequest;
import kr.deepsync.wellness.experiment.dto.response.DailyCheckResponse;
import kr.deepsync.wellness.experiment.dto.response.ExperimentProgressResponse;
import kr.deepsync.wellness.experiment.dto.response.ExperimentProgressSummaryResponse;
import kr.deepsync.wellness.experiment.dto.response.ExperimentResponse;
import kr.deepsync.wellness.experiment.dto.response.ExperimentResultResponse;
import kr.deepsync.wellness.experiment.service.LifestyleExperimentService;
import kr.deepsync.wellness.experiment.service.LifestyleExperimentResultService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/experiments")
public class LifestyleExperimentApi {
    private final LifestyleExperimentService service;
    private final LifestyleExperimentResultService resultService;

    @PostMapping("/{id}/result")
    public ResponseEntity<ApiResponse<ExperimentResultResponse>> createResult(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(resultService.create(member.memberId(), id)));
    }

    @GetMapping("/{id}/result")
    public ApiResponse<ExperimentResultResponse> getResult(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long id) {
        return ApiResponse.success(resultService.get(member.memberId(), id));
    }

    @PutMapping("/{id}/result")
    public ApiResponse<ExperimentResultResponse> recalculateResult(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long id) {
        return ApiResponse.success(resultService.recalculate(member.memberId(), id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExperimentResponse>> create(
            @AuthenticationPrincipal AuthenticatedMember member,
            @Valid @RequestBody CreateExperimentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.create(member.memberId(), request)));
    }

    @GetMapping("/active")
    public ApiResponse<ExperimentResponse> active(@AuthenticationPrincipal AuthenticatedMember member) {
        return ApiResponse.success(service.getOpen(member.memberId()));
    }

    @GetMapping
    public ApiResponse<List<ExperimentResponse>> history(@AuthenticationPrincipal AuthenticatedMember member) {
        return ApiResponse.success(service.getHistory(member.memberId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<ExperimentResponse> get(@AuthenticationPrincipal AuthenticatedMember member,
                                               @PathVariable Long id) {
        return ApiResponse.success(service.get(member.memberId(), id));
    }

    @PatchMapping("/{id}/cancel")
    public ApiResponse<ExperimentResponse> cancel(@AuthenticationPrincipal AuthenticatedMember member,
                                                  @PathVariable Long id) {
        return ApiResponse.success(service.cancel(member.memberId(), id));
    }

    @PostMapping("/{id}/complete")
    public ApiResponse<ExperimentResponse> complete(@AuthenticationPrincipal AuthenticatedMember member,
                                                    @PathVariable Long id) {
        return ApiResponse.success(service.complete(member.memberId(), id));
    }

    @PutMapping("/{id}/daily-checks/{date}")
    public ApiResponse<DailyCheckResponse> check(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long id,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody DailyCheckRequest request) {
        return ApiResponse.success(service.putManualCheck(member.memberId(), id, date, request));
    }

    @PostMapping("/{id}/sync")
    public ApiResponse<List<DailyCheckResponse>> sync(@AuthenticationPrincipal AuthenticatedMember member,
                                                      @PathVariable Long id) {
        return ApiResponse.success(service.sync(member.memberId(), id));
    }

    @GetMapping("/{id}/progress")
    public ApiResponse<ExperimentProgressResponse> progress(@AuthenticationPrincipal AuthenticatedMember member,
                                                            @PathVariable Long id) {
        return ApiResponse.success(service.progress(member.memberId(), id));
    }

    @GetMapping("/{id}/progress/summary")
    public ApiResponse<ExperimentProgressSummaryResponse> progressSummary(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long id) {
        return ApiResponse.success(service.progressSummary(member.memberId(), id));
    }
}
