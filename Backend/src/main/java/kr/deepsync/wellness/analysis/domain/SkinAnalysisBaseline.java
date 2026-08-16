package kr.deepsync.wellness.analysis.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import kr.deepsync.wellness.member.domain.Member;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "skin_analysis_baselines")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SkinAnalysisBaseline extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false, unique = true)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "skin_analysis_id", nullable = false)
    private SkinAnalysis skinAnalysis;

    @Column(nullable = false)
    private LocalDateTime selectedAt;

    private SkinAnalysisBaseline(Member member, SkinAnalysis skinAnalysis, LocalDateTime selectedAt) {
        this.member = member;
        this.skinAnalysis = skinAnalysis;
        this.selectedAt = selectedAt;
    }

    public static SkinAnalysisBaseline create(Member member, SkinAnalysis skinAnalysis, LocalDateTime selectedAt) {
        return new SkinAnalysisBaseline(member, skinAnalysis, selectedAt);
    }

    public void change(SkinAnalysis skinAnalysis, LocalDateTime selectedAt) {
        this.skinAnalysis = skinAnalysis;
        this.selectedAt = selectedAt;
    }
}
