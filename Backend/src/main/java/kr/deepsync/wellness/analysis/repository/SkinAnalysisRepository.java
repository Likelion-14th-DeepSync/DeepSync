package kr.deepsync.wellness.analysis.repository;

import kr.deepsync.wellness.analysis.domain.SkinAnalysis;
import kr.deepsync.wellness.analysis.domain.SkinAnalysisStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SkinAnalysisRepository extends JpaRepository<SkinAnalysis, Long> {
    Optional<SkinAnalysis> findByIdAndSkinImageMemberId(Long id, Long memberId);

    Optional<SkinAnalysis> findBySkinImageIdAndSkinImageMemberId(Long imageId, Long memberId);

    Optional<SkinAnalysis> findFirstBySkinImageMemberIdAndStatusOrderBySkinImageCapturedAtDesc(
            Long memberId, SkinAnalysisStatus status);

    List<SkinAnalysis> findAllBySkinImageMemberIdAndSkinImageCapturedAtGreaterThanEqualAndSkinImageCapturedAtLessThanOrderBySkinImageCapturedAtDesc(
            Long memberId, LocalDateTime startInclusive, LocalDateTime endExclusive);
}
