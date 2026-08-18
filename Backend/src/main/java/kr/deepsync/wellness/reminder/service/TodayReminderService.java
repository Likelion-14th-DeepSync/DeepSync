package kr.deepsync.wellness.reminder.service;

import kr.deepsync.wellness.dday.domain.GoalStatus;
import kr.deepsync.wellness.dday.repository.SkinGoalRepository;
import kr.deepsync.wellness.experiment.domain.ExperimentStatus;
import kr.deepsync.wellness.experiment.domain.LifestyleExperiment;
import kr.deepsync.wellness.experiment.repository.ExperimentDailyCheckRepository;
import kr.deepsync.wellness.experiment.repository.LifestyleExperimentRepository;
import kr.deepsync.wellness.image.domain.ImageQualityStatus;
import kr.deepsync.wellness.image.repository.SkinImageRepository;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import kr.deepsync.wellness.lifestyle.repository.LifestyleRecordRepository;
import kr.deepsync.wellness.reminder.domain.*;
import kr.deepsync.wellness.reminder.dto.response.*;
import kr.deepsync.wellness.reminder.repository.ReminderSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TodayReminderService {
    private static final Set<ExperimentStatus> OPEN_STATUSES =
            EnumSet.of(ExperimentStatus.SCHEDULED, ExperimentStatus.ACTIVE);
    private final ReminderSettingRepository settingRepository;
    private final SkinImageRepository imageRepository;
    private final LifestyleRecordRepository lifestyleRepository;
    private final LifestyleExperimentRepository experimentRepository;
    private final ExperimentDailyCheckRepository checkRepository;
    private final SkinGoalRepository goalRepository;
    private final Clock clock;

    public TodayReminderResponse get(Long memberId) {
        List<ReminderItemResponse> reminders = settingRepository.findAllByMemberIdOrderByReminderTypeAsc(memberId)
                .stream().filter(ReminderSetting::isEnabled)
                .map(setting -> evaluate(memberId, setting))
                .filter(Objects::nonNull).toList();
        String message = reminders.isEmpty() ? "오늘 적용되는 리마인더가 없습니다." : null;
        return new TodayReminderResponse(reminders, message, LocalDateTime.now(clock));
    }

    private ReminderItemResponse evaluate(Long memberId, ReminderSetting setting) {
        ZoneId zone = ZoneId.of(setting.getTimezone());
        ZonedDateTime now = ZonedDateTime.now(clock).withZoneSameInstant(zone);
        LocalDate localDate = now.toLocalDate();
        if (!setting.daySet().contains(localDate.getDayOfWeek())) return null;
        ZonedDateTime scheduled = ZonedDateTime.of(localDate, setting.getReminderTime(), zone);
        Completion completion = completion(memberId, setting.getReminderType(), localDate);
        ReminderStatus status = completion.completed ? ReminderStatus.SKIPPED
                : now.isBefore(scheduled) ? ReminderStatus.PENDING : ReminderStatus.DUE;
        return new ReminderItemResponse(setting.getId(), setting.getReminderType(), localDate,
                scheduled.toOffsetDateTime(), status, title(setting.getReminderType()),
                description(setting.getReminderType(), completion), completion.reason);
    }

    private Completion completion(Long memberId, ReminderType type, LocalDate date) {
        LifestyleRecord lifestyle = lifestyleRepository.findByMemberIdAndRecordDate(memberId, date).orElse(null);
        return switch (type) {
            case SKIN_CAPTURE -> {
                boolean completed = imageRepository
                        .findAllByMemberIdAndCapturedAtGreaterThanEqualAndCapturedAtLessThanOrderByCapturedAtDesc(
                                memberId, date.atStartOfDay(), date.plusDays(1).atStartOfDay()).stream()
                        .anyMatch(image -> image.getQualityStatus() == ImageQualityStatus.PASSED);
                yield new Completion(completed, completed ? "오늘 품질 검사를 통과한 피부 사진이 있습니다." : null, null);
            }
            case LIFESTYLE_RECORD -> new Completion(lifestyle != null,
                    lifestyle != null ? "오늘 생활 기록이 이미 작성됐습니다." : null, null);
            case WATER_INTAKE -> {
                int recorded = lifestyle == null || lifestyle.getWaterIntakeMl() == null
                        ? 0 : lifestyle.getWaterIntakeMl();
                boolean completed = recorded >= 1500;
                yield new Completion(completed, completed ? "오늘 수분 섭취 목표를 달성했습니다." : null,
                        "현재 %dml 기록, %dml 남음".formatted(recorded, Math.max(0, 1500 - recorded)));
            }
            case EXPERIMENT_ACTION -> experimentCompletion(memberId, date);
            case DDAY_ROUTINE -> {
                boolean noGoal = !goalRepository.existsByMemberIdAndStatus(memberId, GoalStatus.ACTIVE);
                yield new Completion(noGoal, noGoal ? "진행 중인 Skin D-Day 목표가 없습니다." : null, null);
            }
            case BEDTIME_PREPARATION -> new Completion(false, null, null);
        };
    }

    private Completion experimentCompletion(Long memberId, LocalDate date) {
        Optional<LifestyleExperiment> experiment = experimentRepository
                .findFirstByMemberIdAndStatusInOrderByCreatedAtDesc(memberId, OPEN_STATUSES);
        if (experiment.isEmpty() || !experiment.get().contains(date)) {
            return new Completion(true, "오늘 진행할 생활 실험이 없습니다.", null);
        }
        boolean achieved = checkRepository.findByExperimentIdAndRecordDate(experiment.get().getId(), date)
                .map(value -> value.isAchieved()).orElse(false);
        return new Completion(achieved, achieved ? "오늘 생활 실험 행동을 달성했습니다." : null,
                experiment.get().getTitle());
    }

    private String title(ReminderType type) {
        return switch (type) {
            case SKIN_CAPTURE -> "오늘 피부 사진을 촬영해 주세요.";
            case LIFESTYLE_RECORD -> "오늘 생활 기록을 작성해 주세요.";
            case WATER_INTAKE -> "오늘 수분 섭취량을 확인해 주세요.";
            case BEDTIME_PREPARATION -> "이제 취침 준비를 시작해 보세요.";
            case EXPERIMENT_ACTION -> "오늘 생활 실험 행동을 확인해 주세요.";
            case DDAY_ROUTINE -> "Skin D-Day 목표를 확인해 주세요.";
        };
    }

    private String description(ReminderType type, Completion completion) {
        if (completion.detail != null) return completion.detail;
        return switch (type) {
            case SKIN_CAPTURE -> "같은 위치와 조명에서 촬영하면 변화 비교가 더 정확해집니다.";
            case LIFESTYLE_RECORD -> "수면·야식·수분 섭취 기록을 남겨주세요.";
            case WATER_INTAKE -> "하루 1.5L 수분 섭취 목표를 확인해 주세요.";
            case BEDTIME_PREPARATION -> "규칙적인 수면을 위해 미리 준비해 보세요.";
            case EXPERIMENT_ACTION -> "현재 진행 중인 실험의 오늘 행동입니다.";
            case DDAY_ROUTINE -> "중요한 날까지의 피부 목표 진행 상황을 확인해 주세요.";
        };
    }

    private record Completion(boolean completed, String reason, String detail) {
    }
}
