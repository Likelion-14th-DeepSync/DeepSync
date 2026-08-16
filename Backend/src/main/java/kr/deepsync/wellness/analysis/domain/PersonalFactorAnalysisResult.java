package kr.deepsync.wellness.analysis.domain;

import jakarta.persistence.*;
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import kr.deepsync.wellness.member.domain.Member;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "personal_factor_analysis_results", uniqueConstraints =
        @UniqueConstraint(name = "uk_personal_factor_result", columnNames = {"member_id", "factor_type", "target_metric"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PersonalFactorAnalysisResult extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 40)
    private FactorType factorType;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private TargetSkinMetric targetMetric;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private FactorAnalysisStatus analysisStatus;
    private Double exposedAverage;
    private Double normalAverage;
    private Double observedDifference;
    @Column(nullable = false) private int exposedCount;
    @Column(nullable = false) private int normalCount;
    @Column(nullable = false) private int missingCount;
    @Column(nullable = false) private double averageModelConfidence;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private AnalysisConfidenceLevel confidenceLevel;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private AssociationDirection associationDirection;
    @Column(nullable = false, length = 500) private String summary;
    @Column(nullable = false) private LocalDate analyzedFrom;
    @Column(nullable = false) private LocalDate analyzedTo;
    @Column(nullable = false) private LocalDateTime calculatedAt;

    private PersonalFactorAnalysisResult(Member member, FactorType factorType, TargetSkinMetric targetMetric,
                                         FactorAnalysisCalculation calculation) {
        this.member = member;
        this.factorType = factorType;
        this.targetMetric = targetMetric;
        apply(calculation);
    }

    public static PersonalFactorAnalysisResult create(Member member, FactorType factorType,
                                                       TargetSkinMetric targetMetric,
                                                       FactorAnalysisCalculation calculation) {
        return new PersonalFactorAnalysisResult(member, factorType, targetMetric, calculation);
    }

    private void apply(FactorAnalysisCalculation calculation) {
        this.analysisStatus = calculation.status();
        this.exposedAverage = calculation.exposedAverage();
        this.normalAverage = calculation.normalAverage();
        this.observedDifference = calculation.observedDifference();
        this.exposedCount = calculation.exposedCount();
        this.normalCount = calculation.normalCount();
        this.missingCount = calculation.missingCount();
        this.averageModelConfidence = calculation.averageModelConfidence();
        this.confidenceLevel = calculation.confidenceLevel();
        this.associationDirection = calculation.direction();
        this.summary = calculation.summary();
        this.analyzedFrom = calculation.analyzedFrom();
        this.analyzedTo = calculation.analyzedTo();
        this.calculatedAt = calculation.calculatedAt();
    }
}
