package kr.deepsync.wellness.member.dto.response;

import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.domain.SkinConcern;

import java.util.Set;

public record MemberProfileResponse(
        Long memberId,
        String email,
        String nickname,
        Set<SkinConcern> skinConcerns
) {
    public static MemberProfileResponse from(Member member) {
        return new MemberProfileResponse(
                member.getId(),
                member.getEmail(),
                member.getNickname(),
                Set.copyOf(member.getSkinConcerns())
        );
    }
}
