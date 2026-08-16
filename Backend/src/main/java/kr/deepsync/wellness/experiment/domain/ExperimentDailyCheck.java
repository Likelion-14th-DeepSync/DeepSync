package kr.deepsync.wellness.experiment.domain;

import jakarta.persistence.*;
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Entity
@Table(name = "experiment_daily_checks", uniqueConstraints =
        @UniqueConstraint(name = "uk_experiment_daily_checks_experiment_date", columnNames = {"experiment_id", "record_date"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExperimentDailyCheck extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "experiment_id", nullable = false)
    private LifestyleExperiment experiment;
    @Column(nullable = false) private LocalDate recordDate;
    @Column(nullable = false) private boolean achieved;
    @Column(length = 100) private String actualValue;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private CheckSourceType sourceType;
    @Column(length = 500) private String note;

    private ExperimentDailyCheck(LifestyleExperiment experiment, LocalDate date, boolean achieved,
                                 String actualValue, CheckSourceType sourceType, String note) {
        this.experiment = experiment;
        this.recordDate = date;
        update(achieved, actualValue, sourceType, note);
    }
    public static ExperimentDailyCheck create(LifestyleExperiment experiment, LocalDate date, boolean achieved,
                                              String actualValue, CheckSourceType sourceType, String note) {
        return new ExperimentDailyCheck(experiment, date, achieved, actualValue, sourceType, note);
    }
    public void update(boolean achieved, String actualValue, CheckSourceType sourceType, String note) {
        this.achieved = achieved;
        this.actualValue = actualValue;
        this.sourceType = sourceType;
        this.note = note;
    }
}
