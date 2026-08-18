package kr.deepsync.wellness.reminder.api;

import jakarta.validation.Valid;
import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.reminder.domain.ReminderType;
import kr.deepsync.wellness.reminder.dto.request.ReminderSettingRequest;
import kr.deepsync.wellness.reminder.dto.response.*;
import kr.deepsync.wellness.reminder.service.ReminderSettingService;
import kr.deepsync.wellness.reminder.service.TodayReminderService;
import kr.deepsync.wellness.security.AuthenticatedMember;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reminders")
public class ReminderApi {
    private final ReminderSettingService settingService;
    private final TodayReminderService todayService;

    @GetMapping("/settings")
    public ApiResponse<List<ReminderSettingResponse>> settings(
            @AuthenticationPrincipal AuthenticatedMember member) {
        return ApiResponse.success(settingService.getAll(member.memberId()));
    }

    @PutMapping("/settings/{type}")
    public ApiResponse<ReminderSettingResponse> put(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable ReminderType type,
            @Valid @RequestBody ReminderSettingRequest request) {
        return ApiResponse.success(settingService.put(member.memberId(), type, request));
    }

    @PatchMapping("/settings/{type}/disable")
    public ApiResponse<ReminderSettingResponse> disable(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable ReminderType type) {
        return ApiResponse.success(settingService.disable(member.memberId(), type));
    }

    @DeleteMapping("/settings/{type}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedMember member,
            @PathVariable ReminderType type) {
        settingService.delete(member.memberId(), type);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/today")
    public ApiResponse<TodayReminderResponse> today(
            @AuthenticationPrincipal AuthenticatedMember member) {
        return ApiResponse.success(todayService.get(member.memberId()));
    }
}
