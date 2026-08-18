package kr.deepsync.wellness.reminder.repository;

import kr.deepsync.wellness.reminder.domain.ReminderSetting;
import kr.deepsync.wellness.reminder.domain.ReminderType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReminderSettingRepository extends JpaRepository<ReminderSetting, Long> {
    Optional<ReminderSetting> findByMemberIdAndReminderType(Long memberId, ReminderType type);
    List<ReminderSetting> findAllByMemberIdOrderByReminderTypeAsc(Long memberId);
}
