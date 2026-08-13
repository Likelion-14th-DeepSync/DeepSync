package kr.deepsync.wellness.member.api;

import jakarta.validation.Valid;
import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.member.dto.request.UpdateMemberProfileRequest;
import kr.deepsync.wellness.member.dto.response.MemberProfileResponse;
import kr.deepsync.wellness.member.service.MemberService;
import kr.deepsync.wellness.security.AuthenticatedMember;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/members")
public class MemberApi {

    private final MemberService memberService;

    @GetMapping("/me")
    public ApiResponse<MemberProfileResponse> getMyProfile(
            @AuthenticationPrincipal AuthenticatedMember member
    ) {
        return ApiResponse.success(memberService.getMyProfile(member.memberId()));
    }

    @PatchMapping("/me")
    public ApiResponse<MemberProfileResponse> updateMyProfile(
            @AuthenticationPrincipal AuthenticatedMember member,
            @Valid @RequestBody UpdateMemberProfileRequest request
    ) {
        return ApiResponse.success(memberService.updateMyProfile(member.memberId(), request));
    }
}
