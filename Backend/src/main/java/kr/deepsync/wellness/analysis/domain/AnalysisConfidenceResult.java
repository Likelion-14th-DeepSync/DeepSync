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
@Table(name = "analysis_confidence_results")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnalysisConfidenceResult extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false, unique = true)
    private Member member;
    @Column(nullable = false) private int score;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private AnalysisConfidenceLevel confidenceLevel;
    @Column(nullable = false) private int imageQualityScore;
    @Column(nullable = false) private boolean imageQualityAvailable;
    @Column(nullable = false) private int skinRecordCoverageScore;
    @Column(nullable = false) private int lifestyleCompletenessScore;
    @Column(nullable = false) private int environmentCompletenessScore;
    @Column(nullable = false) private int repeatedObservationScore;
    @Column(nullable = false) private boolean repeatedObservationAvailable;
    @Column(nullable = false) private int experimentEvidenceScore;
    @Column(nullable = false) private boolean experimentEvidenceAvailable;
    @Column(nullable = false) private int modelConfidenceScore;
    @Column(nullable = false) private boolean modelConfidenceAvailable;
    @Column(nullable = false) private int skinRecordedDays;
    @Column(nullable = false, length = 1500) private String reasons;
    @Column(nullable = false, length = 1500) private String nextActions;
    @Column(nullable = false) private LocalDate analyzedFrom;
    @Column(nullable = false) private LocalDate analyzedTo;
    @Column(nullable = false) private LocalDateTime calculatedAt;

    private AnalysisConfidenceResult(Member member, AnalysisConfidenceEvidence evidence,
                                     AnalysisConfidenceCalculation calculation) {
        this.member = member;
        update(evidence, calculation);
    }

    public static AnalysisConfidenceResult create(Member member, AnalysisConfidenceEvidence evidence,
                                                  AnalysisConfidenceCalculation calculation) {
        return new AnalysisConfidenceResult(member, evidence, calculation);
    }

    public void update(AnalysisConfidenceEvidence evidence, AnalysisConfidenceCalculation calculation) {
        score = calculation.score();
        confidenceLevel = calculation.level();
        imageQualityScore = evidence.imageQualityScore();
        imageQualityAvailable = evidence.imageQualityAvailable();
        skinRecordCoverageScore = evidence.skinRecordCoverageScore();
        lifestyleCompletenessScore = evidence.lifestyleCompletenessScore();
        environmentCompletenessScore = evidence.environmentCompletenessScore();
        repeatedObservationScore = evidence.repeatedObservationScore();
        repeatedObservationAvailable = evidence.repeatedObservationAvailable();
        experimentEvidenceScore = evidence.experimentEvidenceScore();
        experimentEvidenceAvailable = evidence.experimentEvidenceAvailable();
        modelConfidenceScore = evidence.modelConfidenceScore();
        modelConfidenceAvailable = evidence.modelConfidenceAvailable();
        skinRecordedDays = evidence.skinRecordedDays();
        reasons = String.join("|", calculation.reasons());
        nextActions = String.join("|", calculation.nextActions());
        analyzedFrom = evidence.analyzedFrom();
        analyzedTo = evidence.analyzedTo();
        calculatedAt = calculation.calculatedAt();
    }
}
