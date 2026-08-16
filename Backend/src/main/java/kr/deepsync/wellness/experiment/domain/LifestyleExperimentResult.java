package kr.deepsync.wellness.experiment.domain;

import jakarta.persistence.*;
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "lifestyle_experiment_results")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LifestyleExperimentResult extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "experiment_id", nullable = false, unique = true)
    private LifestyleExperiment experiment;
    @Column(nullable = false) private int evaluatedDays;
    @Column(nullable = false) private int achievedDays;
    @Column(nullable = false) private int missingDays;
    @Column(nullable = false) private double achievementRate;
    @Column(nullable = false) private int beforeAnalysisCount;
    @Column(nullable = false) private int afterAnalysisCount;
    @Column(nullable = false) private double beforeRednessScore;
    @Column(nullable = false) private double afterRednessScore;
    @Column(nullable = false) private double beforeTroubleScore;
    @Column(nullable = false) private double afterTroubleScore;
    @Column(nullable = false) private double beforeDrynessScore;
    @Column(nullable = false) private double afterDrynessScore;
    @Column(nullable = false) private double beforeToneUniformityScore;
    @Column(nullable = false) private double afterToneUniformityScore;
    @Column(nullable = false) private double beforeOverallScore;
    @Column(nullable = false) private double afterOverallScore;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private SkinMetric mostChangedMetric;
    @Column(nullable = false) private double mostChangedAmount;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private ChangeDirection changeDirection;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private ExperimentConfidenceLevel confidenceLevel;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private ExperimentRecommendation recommendation;
    @Column(nullable = false, length = 1000) private String confidenceReasons;
    @Column(nullable = false, length = 500) private String summary;
    @Column(nullable = false) private LocalDateTime calculatedAt;

    private LifestyleExperimentResult(LifestyleExperiment experiment, ExperimentResultCalculation calculation) {
        this.experiment = experiment;
        update(calculation);
    }

    public static LifestyleExperimentResult create(LifestyleExperiment experiment,
                                                    ExperimentResultCalculation calculation) {
        return new LifestyleExperimentResult(experiment, calculation);
    }

    public void update(ExperimentResultCalculation calculation) {
        this.evaluatedDays = calculation.evaluatedDays();
        this.achievedDays = calculation.achievedDays();
        this.missingDays = calculation.missingDays();
        this.achievementRate = calculation.achievementRate();
        this.beforeAnalysisCount = calculation.beforeAnalysisCount();
        this.afterAnalysisCount = calculation.afterAnalysisCount();
        this.beforeRednessScore = calculation.beforeRednessScore();
        this.afterRednessScore = calculation.afterRednessScore();
        this.beforeTroubleScore = calculation.beforeTroubleScore();
        this.afterTroubleScore = calculation.afterTroubleScore();
        this.beforeDrynessScore = calculation.beforeDrynessScore();
        this.afterDrynessScore = calculation.afterDrynessScore();
        this.beforeToneUniformityScore = calculation.beforeToneUniformityScore();
        this.afterToneUniformityScore = calculation.afterToneUniformityScore();
        this.beforeOverallScore = calculation.beforeOverallScore();
        this.afterOverallScore = calculation.afterOverallScore();
        this.mostChangedMetric = calculation.mostChangedMetric();
        this.mostChangedAmount = calculation.mostChangedAmount();
        this.changeDirection = calculation.changeDirection();
        this.confidenceLevel = calculation.confidenceLevel();
        this.recommendation = calculation.recommendation();
        this.confidenceReasons = String.join("|", calculation.confidenceReasons());
        this.summary = calculation.summary();
        this.calculatedAt = calculation.calculatedAt();
    }
}
