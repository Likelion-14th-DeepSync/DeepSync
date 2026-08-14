package kr.deepsync.wellness.image.domain;

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
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "skin_image_quality_results")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SkinImageQuality extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "skin_image_id", nullable = false, unique = true)
    private SkinImage skinImage;

    @Column(nullable = false)
    private int resolutionScore;

    @Column(nullable = false)
    private int lightingScore;

    @Column(nullable = false)
    private int lightingUniformityScore;

    @Column(nullable = false)
    private int sharpnessScore;

    @Column(nullable = false)
    private int overallScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ImageQualityStatus qualityStatus;

    @Column(nullable = false, length = 1000)
    private String failureReasons;

    @Column(nullable = false, length = 50)
    private String modelVersion;

    @Column(nullable = false)
    private LocalDateTime analyzedAt;

    private SkinImageQuality(SkinImage image, QualityAnalysis analysis, LocalDateTime analyzedAt) {
        this.skinImage = image;
        update(analysis, analyzedAt);
    }
    public static SkinImageQuality create(SkinImage image, QualityAnalysis analysis, LocalDateTime analyzedAt) {
        return new SkinImageQuality(image, analysis, analyzedAt);
    }

    public void update(QualityAnalysis analysis, LocalDateTime analyzedAt) {
        this.resolutionScore = analysis.resolutionScore();
        this.lightingScore = analysis.lightingScore();
        this.lightingUniformityScore = analysis.lightingUniformityScore();
        this.sharpnessScore = analysis.sharpnessScore();
        this.overallScore = analysis.overallScore();
        this.qualityStatus = analysis.status();
        this.failureReasons = String.join("|", analysis.failureReasons());
        this.modelVersion = analysis.modelVersion();
        this.analyzedAt = analyzedAt;
    }
}
