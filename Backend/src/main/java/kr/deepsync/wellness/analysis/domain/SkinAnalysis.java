package kr.deepsync.wellness.analysis.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import kr.deepsync.wellness.analysis.dto.request.SkinAnalysisResultRequest;
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import kr.deepsync.wellness.image.domain.SkinImage;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "skin_analyses")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SkinAnalysis extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "skin_image_id", nullable = false, unique = true)
    private SkinImage skinImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SkinAnalysisStatus status;

    private Integer rednessScore;
    private Integer troubleScore;
    private Integer drynessScore;
    private Integer toneUniformityScore;
    private Integer overallScore;
    private Integer confidenceScore;

    @Column(length = 100)
    private String modelVersion;

    @Column(length = 500)
    private String failureReason;

    private LocalDateTime analyzedAt;

    private SkinAnalysis(SkinImage skinImage) {
        this.skinImage = skinImage;
        this.status = SkinAnalysisStatus.PENDING;
    }

    public static SkinAnalysis request(SkinImage skinImage) {
        return new SkinAnalysis(skinImage);
    }

    public void startProcessing() {
        this.status = SkinAnalysisStatus.PROCESSING;
        this.failureReason = null;
    }

    public void complete(SkinAnalysisResultRequest result, LocalDateTime analyzedAt) {
        this.rednessScore = result.rednessScore();
        this.troubleScore = result.troubleScore();
        this.drynessScore = result.drynessScore();
        this.toneUniformityScore = result.toneUniformityScore();
        this.overallScore = result.overallScore();
        this.confidenceScore = result.confidenceScore();
        this.modelVersion = result.modelVersion();
        this.analyzedAt = analyzedAt;
        this.failureReason = null;
        this.status = SkinAnalysisStatus.COMPLETED;
    }

    public void fail(String reason, LocalDateTime analyzedAt) {
        this.failureReason = reason;
        this.analyzedAt = analyzedAt;
        this.status = SkinAnalysisStatus.FAILED;
    }

    public void retry() {
        this.rednessScore = null;
        this.troubleScore = null;
        this.drynessScore = null;
        this.toneUniformityScore = null;
        this.overallScore = null;
        this.confidenceScore = null;
        this.modelVersion = null;
        this.failureReason = null;
        this.analyzedAt = null;
        this.status = SkinAnalysisStatus.PENDING;
    }
}
