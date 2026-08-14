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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import kr.deepsync.wellness.member.domain.Member;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "skin_images")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SkinImage extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, unique = true, length = 255)
    private String storageKey;

    @Column(nullable = false, length = 20)
    private String contentType;

    @Column(nullable = false)
    private long fileSize;

    @Column(nullable = false)
    private LocalDateTime capturedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FaceDirection direction;

    @Column(nullable = false)
    private boolean makeupApplied;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ImageQualityStatus qualityStatus;

    private SkinImage(Member member, String storageKey, String contentType, long fileSize,
                      LocalDateTime capturedAt, FaceDirection direction, boolean makeupApplied) {
        this.member = member;
        this.storageKey = storageKey;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.capturedAt = capturedAt;
        this.direction = direction;
        this.makeupApplied = makeupApplied;
        this.qualityStatus = ImageQualityStatus.PENDING;
    }

    public static SkinImage create(Member member, String storageKey, String contentType, long fileSize,
                                   LocalDateTime capturedAt, FaceDirection direction, boolean makeupApplied) {
        return new SkinImage(member, storageKey, contentType, fileSize, capturedAt, direction, makeupApplied);
    }

    public void updateQualityStatus(ImageQualityStatus qualityStatus) {
        this.qualityStatus = qualityStatus;
    }
}
