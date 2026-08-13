package kr.deepsync.wellness.dday.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.domain.SkinConcern;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Entity
@Table(name = "skin_goals")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SkinGoal extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false)
    private LocalDate targetDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SkinConcern targetConcern;

    @Column(length = 500)
    private String targetDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GoalStatus status;

    private SkinGoal(
            Member member,
            String title,
            LocalDate targetDate,
            SkinConcern targetConcern,
            String targetDescription
    ) {
        this.member = member;
        this.title = title;
        this.targetDate = targetDate;
        this.targetConcern = targetConcern;
        this.targetDescription = targetDescription;
        this.status = GoalStatus.ACTIVE;
    }

    public static SkinGoal create(
            Member member,
            String title,
            LocalDate targetDate,
            SkinConcern targetConcern,
            String targetDescription
    ) {
        return new SkinGoal(member, title, targetDate, targetConcern, targetDescription);
    }

    public void update(
            String title,
            LocalDate targetDate,
            SkinConcern targetConcern,
            String targetDescription
    ) {
        validateActive();
        this.title = title;
        this.targetDate = targetDate;
        this.targetConcern = targetConcern;
        this.targetDescription = targetDescription;
    }

    public void complete() {
        validateActive();
        this.status = GoalStatus.COMPLETED;
    }

    public void cancel() {
        validateActive();
        this.status = GoalStatus.CANCELLED;
    }

    private void validateActive() {
        if (status != GoalStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.SKIN_GOAL_NOT_ACTIVE);
        }
    }
}
