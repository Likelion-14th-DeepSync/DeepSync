package kr.deepsync.wellness.dday.dto.response;

import kr.deepsync.wellness.dday.domain.GoalStatus;
import kr.deepsync.wellness.dday.domain.SkinGoal;
import kr.deepsync.wellness.member.domain.SkinConcern;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record SkinGoalResponse(
        Long goalId,
        String title,
        LocalDate targetDate,
        long daysRemaining,
        String dayLabel,
        SkinConcern targetConcern,
        String targetDescription,
        GoalStatus status
) {
    public static SkinGoalResponse from(SkinGoal goal, LocalDate today) {
        long daysRemaining = ChronoUnit.DAYS.between(today, goal.getTargetDate());
        return new SkinGoalResponse(
                goal.getId(),
                goal.getTitle(),
                goal.getTargetDate(),
                daysRemaining,
                dayLabel(daysRemaining),
                goal.getTargetConcern(),
                goal.getTargetDescription(),
                goal.getStatus()
        );
    }

    private static String dayLabel(long daysRemaining) {
        if (daysRemaining > 0) {
            return "D-" + daysRemaining;
        }
        if (daysRemaining == 0) {
            return "D-Day";
        }
        return "D+" + Math.abs(daysRemaining);
    }
}
