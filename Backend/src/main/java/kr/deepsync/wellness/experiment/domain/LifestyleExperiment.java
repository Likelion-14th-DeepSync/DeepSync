package kr.deepsync.wellness.experiment.domain;

import jakarta.persistence.*;
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.member.domain.Member;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "lifestyle_experiments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LifestyleExperiment extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    @Column(nullable = false, length = 100)
    private String title;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 40)
    private ExperimentType experimentType;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private ExperimentPeriod experimentPeriod;
    @Column(nullable = false) private LocalDate startDate;
    @Column(nullable = false) private LocalDate endDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private ExperimentStatus status;
    private LocalDateTime completedAt;

    private LifestyleExperiment(Member member, String title, ExperimentType type, ExperimentPeriod period,
                                LocalDate startDate, LocalDate today) {
        this.member = member;
        this.title = title;
        this.experimentType = type;
        this.experimentPeriod = period;
        this.startDate = startDate;
        this.endDate = startDate.plusDays(period.getDays() - 1L);
        this.status = startDate.isAfter(today) ? ExperimentStatus.SCHEDULED : ExperimentStatus.ACTIVE;
    }
    public static LifestyleExperiment create(Member member, String title, ExperimentType type,
                                             ExperimentPeriod period, LocalDate startDate, LocalDate today) {
        return new LifestyleExperiment(member, title, type, period, startDate, today);
    }
    public void activateIfStarted(LocalDate today) {
        if (status == ExperimentStatus.SCHEDULED && !startDate.isAfter(today)) status = ExperimentStatus.ACTIVE;
    }
    public void cancel() {
        validateEditable();
        status = ExperimentStatus.CANCELLED;
    }
    public void complete(LocalDate today, LocalDateTime now) {
        validateEditable();
        if (today.isBefore(endDate)) throw new BusinessException(ErrorCode.EXPERIMENT_NOT_FINISHED);
        status = ExperimentStatus.COMPLETED;
        completedAt = now;
    }
    public void validateEditable() {
        if (status != ExperimentStatus.SCHEDULED && status != ExperimentStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.EXPERIMENT_NOT_EDITABLE);
        }
    }
    public boolean contains(LocalDate date) {
        return !date.isBefore(startDate) && !date.isAfter(endDate);
    }
}
