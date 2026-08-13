package kr.deepsync.wellness.dday.service;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.dday.domain.GoalStatus;
import kr.deepsync.wellness.dday.domain.SkinGoal;
import kr.deepsync.wellness.dday.dto.request.CreateSkinGoalRequest;
import kr.deepsync.wellness.dday.dto.request.UpdateSkinGoalRequest;
import kr.deepsync.wellness.dday.dto.response.SkinGoalResponse;
import kr.deepsync.wellness.dday.exception.SkinGoalNotFoundException;
import kr.deepsync.wellness.dday.repository.SkinGoalRepository;
import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.domain.SkinConcern;
import kr.deepsync.wellness.member.exception.MemberNotFoundException;
import kr.deepsync.wellness.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SkinGoalService {

    private final SkinGoalRepository skinGoalRepository;
    private final MemberRepository memberRepository;
    private final Clock clock;

    @Transactional
    public SkinGoalResponse create(Long memberId, CreateSkinGoalRequest request) {
        Member member = findMember(memberId);
        validateDate(request.targetDate());
        validateConcern(member, request.targetConcern());
        if (skinGoalRepository.existsByMemberIdAndStatus(memberId, GoalStatus.ACTIVE)) {
            throw new BusinessException(ErrorCode.ACTIVE_SKIN_GOAL_EXISTS);
        }

        SkinGoal goal = SkinGoal.create(
                member,
                request.title(),
                request.targetDate(),
                request.targetConcern(),
                request.targetDescription()
        );
        return response(skinGoalRepository.save(goal));
    }

    public SkinGoalResponse getActive(Long memberId) {
        SkinGoal goal = skinGoalRepository.findByMemberIdAndStatus(memberId, GoalStatus.ACTIVE)
                .orElseThrow(SkinGoalNotFoundException::new);
        return response(goal);
    }

    public List<SkinGoalResponse> getHistory(Long memberId) {
        return skinGoalRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId).stream()
                .map(this::response)
                .toList();
    }

    @Transactional
    public SkinGoalResponse update(Long memberId, Long goalId, UpdateSkinGoalRequest request) {
        SkinGoal goal = findOwnedGoal(memberId, goalId);
        validateDate(request.targetDate());
        validateConcern(goal.getMember(), request.targetConcern());
        goal.update(request.title(), request.targetDate(), request.targetConcern(), request.targetDescription());
        return response(goal);
    }

    @Transactional
    public SkinGoalResponse complete(Long memberId, Long goalId) {
        SkinGoal goal = findOwnedGoal(memberId, goalId);
        goal.complete();
        return response(goal);
    }

    @Transactional
    public SkinGoalResponse cancel(Long memberId, Long goalId) {
        SkinGoal goal = findOwnedGoal(memberId, goalId);
        goal.cancel();
        return response(goal);
    }

    private Member findMember(Long memberId) {
        return memberRepository.findById(memberId).orElseThrow(MemberNotFoundException::new);
    }

    private SkinGoal findOwnedGoal(Long memberId, Long goalId) {
        return skinGoalRepository.findByIdAndMemberId(goalId, memberId)
                .orElseThrow(SkinGoalNotFoundException::new);
    }

    private void validateDate(LocalDate targetDate) {
        if (!targetDate.isAfter(LocalDate.now(clock))) {
            throw new BusinessException(ErrorCode.INVALID_GOAL_DATE);
        }
    }

    private void validateConcern(Member member, SkinConcern targetConcern) {
        if (!member.getSkinConcerns().contains(targetConcern)) {
            throw new BusinessException(ErrorCode.UNREGISTERED_SKIN_CONCERN);
        }
    }

    private SkinGoalResponse response(SkinGoal goal) {
        return SkinGoalResponse.from(goal, LocalDate.now(clock));
    }
}
