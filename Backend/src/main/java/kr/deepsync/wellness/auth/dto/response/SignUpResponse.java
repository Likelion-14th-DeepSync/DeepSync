package kr.deepsync.wellness.auth.dto.response;

import kr.deepsync.wellness.member.domain.Member;

public record SignUpResponse(Long memberId, String email, String nickname) {
    public static SignUpResponse from(Member member) {
        return new SignUpResponse(member.getId(), member.getEmail(), member.getNickname());
    }
}
