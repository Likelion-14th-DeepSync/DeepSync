package kr.deepsync.wellness.security;

import kr.deepsync.wellness.member.domain.MemberRole;

public record AuthenticatedMember(Long memberId, MemberRole role) {
}
