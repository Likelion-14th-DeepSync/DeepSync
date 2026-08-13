package kr.deepsync.wellness.dday.api;

import jakarta.validation.Valid;
import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.dday.dto.request.CreateSkinGoalRequest;
import kr.deepsync.wellness.dday.dto.request.UpdateSkinGoalRequest;
import kr.deepsync.wellness.dday.dto.response.SkinGoalResponse;
import kr.deepsync.wellness.dday.service.SkinGoalService;
import kr.deepsync.wellness.security.AuthenticatedMember;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/skin-goals")
public class SkinGoalApi {

    private final SkinGoalService skinGoalService;

    @PostMapping
    public ResponseEntity<ApiResponse<SkinGoalResponse>> create(
            @AuthenticationPrincipal AuthenticatedMember member,
            @Valid @RequestBody CreateSkinGoalRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(skinGoalService.create(member.memberId(), request)));
    }

    @GetMapping("/active")
    public ApiResponse<SkinGoalResponse> getActive(
            @AuthenticationPrincipal AuthenticatedMember member
    ) {
        return ApiResponse.success(skinGoalService.getActive(member.memberId()));
    }

    @GetMapping
    public ApiResponse<List<SkinGoalResponse>> getHistory(
            @AuthenticationPrincipal AuthenticatedMember member
    ) {
        return ApiResponse.success(skinGoalService.getHistory(member.memberId()));
    }

    @PatchMapping("/{goalId}")
    public ApiResponse<SkinGoalResponse> update(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long goalId,
            @Valid @RequestBody UpdateSkinGoalRequest request
    ) {
        return ApiResponse.success(skinGoalService.update(member.memberId(), goalId, request));
    }

    @PatchMapping("/{goalId}/complete")
    public ApiResponse<SkinGoalResponse> complete(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long goalId
    ) {
        return ApiResponse.success(skinGoalService.complete(member.memberId(), goalId));
    }

    @PatchMapping("/{goalId}/cancel")
    public ApiResponse<SkinGoalResponse> cancel(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable Long goalId
    ) {
        return ApiResponse.success(skinGoalService.cancel(member.memberId(), goalId));
    }
}
