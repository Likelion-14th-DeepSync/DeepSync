package kr.deepsync.wellness.member.service;

import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.dto.request.UpdateMemberProfileRequest;
import kr.deepsync.wellness.member.dto.response.MemberProfileResponse;
import kr.deepsync.wellness.member.exception.MemberNotFoundException;
import kr.deepsync.wellness.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberProfileResponse getMyProfile(Long memberId) {
        return MemberProfileResponse.from(findMember(memberId));
    }

    @Transactional
    public MemberProfileResponse updateMyProfile(Long memberId, UpdateMemberProfileRequest request) {
        Member member = findMember(memberId);
        member.updateProfile(request.nickname(), request.skinConcerns());
        return MemberProfileResponse.from(member);
    }

    private Member findMember(Long memberId) {
        return memberRepository.findById(memberId).orElseThrow(MemberNotFoundException::new);
    }
}
