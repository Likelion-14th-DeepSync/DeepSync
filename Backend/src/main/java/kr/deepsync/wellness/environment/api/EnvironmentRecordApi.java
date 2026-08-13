package kr.deepsync.wellness.environment.api;

import jakarta.validation.Valid;
import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.environment.dto.request.EnvironmentRecordRequest;
import kr.deepsync.wellness.environment.dto.response.EnvironmentRecordResponse;
import kr.deepsync.wellness.environment.service.EnvironmentRecordService;
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
@RequestMapping("/api/v1/environment-records")
public class EnvironmentRecordApi {
    private final EnvironmentRecordService service;

    @PostMapping
    public ResponseEntity<ApiResponse<EnvironmentRecordResponse>> create(
            @AuthenticationPrincipal AuthenticatedMember member,
            @Valid @RequestBody EnvironmentRecordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.create(member.memberId(), request)));
    }

    @GetMapping("/{date}")
    public ApiResponse<EnvironmentRecordResponse> get(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success(service.get(member.memberId(), date));
    }

    @GetMapping
    public ApiResponse<List<EnvironmentRecordResponse>> getRange(
            @AuthenticationPrincipal AuthenticatedMember member,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.success(service.getRange(member.memberId(), startDate, endDate));
    }

    @PatchMapping("/{date}")
    public ApiResponse<EnvironmentRecordResponse> update(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody EnvironmentRecordRequest request) {
        return ApiResponse.success(service.update(member.memberId(), date, request));
    }
}
