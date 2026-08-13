package kr.deepsync.wellness.dday.repository;

import kr.deepsync.wellness.dday.domain.GoalStatus;
import kr.deepsync.wellness.dday.domain.SkinGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SkinGoalRepository extends JpaRepository<SkinGoal, Long> {
    boolean existsByMemberIdAndStatus(Long memberId, GoalStatus status);
    Optional<SkinGoal> findByMemberIdAndStatus(Long memberId, GoalStatus status);
    Optional<SkinGoal> findByIdAndMemberId(Long goalId, Long memberId);
    List<SkinGoal> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);
}
