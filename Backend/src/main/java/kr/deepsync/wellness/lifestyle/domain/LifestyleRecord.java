package kr.deepsync.wellness.lifestyle.domain;

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
import jakarta.persistence.UniqueConstraint;
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import kr.deepsync.wellness.common.domain.DataSourceType;
import kr.deepsync.wellness.member.domain.Member;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Entity
@Table(name = "lifestyle_records", uniqueConstraints =
        @UniqueConstraint(name = "uk_lifestyle_records_member_date", columnNames = {"member_id", "record_date"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LifestyleRecord extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private LocalDate recordDate;

    private Integer sleepDurationMinutes;
    private LocalTime bedtime;
    private LocalTime wakeUpTime;
    private Boolean lateNightMeal;
    private Integer waterIntakeMl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DataSourceType sourceType;

    private LifestyleRecord(Member member, LocalDate recordDate, Integer sleepDurationMinutes,
                            LocalTime bedtime, LocalTime wakeUpTime, Boolean lateNightMeal,
                            Integer waterIntakeMl, DataSourceType sourceType) {
        this.member = member;
        update(recordDate, sleepDurationMinutes, bedtime, wakeUpTime, lateNightMeal, waterIntakeMl, sourceType);
    }

    public static LifestyleRecord create(Member member, LocalDate recordDate, Integer sleepDurationMinutes,
                                         LocalTime bedtime, LocalTime wakeUpTime, Boolean lateNightMeal,
                                         Integer waterIntakeMl, DataSourceType sourceType) {
        return new LifestyleRecord(member, recordDate, sleepDurationMinutes, bedtime, wakeUpTime,
                lateNightMeal, waterIntakeMl, sourceType);
    }

    public void update(LocalDate recordDate, Integer sleepDurationMinutes, LocalTime bedtime,
                       LocalTime wakeUpTime, Boolean lateNightMeal, Integer waterIntakeMl,
                       DataSourceType sourceType) {
        this.recordDate = recordDate;
        this.sleepDurationMinutes = sleepDurationMinutes;
        this.bedtime = bedtime;
        this.wakeUpTime = wakeUpTime;
        this.lateNightMeal = lateNightMeal;
        this.waterIntakeMl = waterIntakeMl;
        this.sourceType = sourceType;
    }
}
