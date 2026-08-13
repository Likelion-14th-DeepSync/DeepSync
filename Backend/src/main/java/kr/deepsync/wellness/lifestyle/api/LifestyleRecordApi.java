package kr.deepsync.wellness.lifestyle.api;

import jakarta.validation.Valid;
import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.lifestyle.dto.request.LifestyleRecordRequest;
import kr.deepsync.wellness.lifestyle.dto.response.LifestyleRecordResponse;
import kr.deepsync.wellness.lifestyle.service.LifestyleRecordService;
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
@RequestMapping("/api/v1/lifestyle-records")
public class LifestyleRecordApi {
    private final LifestyleRecordService service;

    @PostMapping
    public ResponseEntity<ApiResponse<LifestyleRecordResponse>> create(
            @AuthenticationPrincipal AuthenticatedMember member,
            @Valid @RequestBody LifestyleRecordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.create(member.memberId(), request)));
    }

    @GetMapping("/{date}")
    public ApiResponse<LifestyleRecordResponse> get(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success(service.get(member.memberId(), date));
    }

    @GetMapping
    public ApiResponse<List<LifestyleRecordResponse>> getRange(
            @AuthenticationPrincipal AuthenticatedMember member,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.success(service.getRange(member.memberId(), startDate, endDate));
    }

    @PatchMapping("/{date}")
    public ApiResponse<LifestyleRecordResponse> update(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody LifestyleRecordRequest request) {
        return ApiResponse.success(service.update(member.memberId(), date, request));
    }
}
