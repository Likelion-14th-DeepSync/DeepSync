package kr.deepsync.wellness.reminder.domain;

import jakarta.persistence.*;
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import kr.deepsync.wellness.member.domain.Member;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Entity
@Table(name = "reminder_settings", uniqueConstraints =
        @UniqueConstraint(name = "uk_reminder_settings_member_type", columnNames = {"member_id", "reminder_type"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReminderSetting extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 40)
    private ReminderType reminderType;
    @Column(nullable = false) private boolean enabled;
    @Column(nullable = false) private LocalTime reminderTime;
    @Column(nullable = false, length = 100) private String daysOfWeek;
    @Column(nullable = false, length = 50) private String timezone;

    private ReminderSetting(Member member, ReminderType type, boolean enabled, LocalTime time,
                            Set<DayOfWeek> days, String timezone) {
        this.member = member;
        this.reminderType = type;
        update(enabled, time, days, timezone);
    }

    public static ReminderSetting create(Member member, ReminderType type, boolean enabled, LocalTime time,
                                         Set<DayOfWeek> days, String timezone) {
        return new ReminderSetting(member, type, enabled, time, days, timezone);
    }

    public void update(boolean enabled, LocalTime time, Set<DayOfWeek> days, String timezone) {
        this.enabled = enabled;
        this.reminderTime = time;
        this.daysOfWeek = days.stream().sorted().map(Enum::name).collect(Collectors.joining("|"));
        this.timezone = timezone;
    }

    public void disable() {
        this.enabled = false;
    }

    public Set<DayOfWeek> daySet() {
        if (daysOfWeek.isBlank()) return Set.of();
        return Arrays.stream(daysOfWeek.split("\\|"))
                .map(DayOfWeek::valueOf).collect(Collectors.toUnmodifiableSet());
    }
}
