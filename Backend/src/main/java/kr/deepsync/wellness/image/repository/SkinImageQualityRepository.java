package kr.deepsync.wellness.image.repository;

import kr.deepsync.wellness.image.domain.SkinImageQuality;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;

public interface SkinImageQualityRepository extends JpaRepository<SkinImageQuality, Long> {
    Optional<SkinImageQuality> findBySkinImageIdAndSkinImageMemberId(Long imageId, Long memberId);
    Optional<SkinImageQuality> findBySkinImageId(Long imageId);
    List<SkinImageQuality> findAllBySkinImageMemberIdAndSkinImageCapturedAtGreaterThanEqualAndSkinImageCapturedAtLessThan(
            Long memberId, LocalDateTime startInclusive, LocalDateTime endExclusive);
}
