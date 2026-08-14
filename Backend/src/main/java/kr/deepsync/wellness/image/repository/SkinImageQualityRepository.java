package kr.deepsync.wellness.image.repository;

import kr.deepsync.wellness.image.domain.SkinImageQuality;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SkinImageQualityRepository extends JpaRepository<SkinImageQuality, Long> {
    Optional<SkinImageQuality> findBySkinImageIdAndSkinImageMemberId(Long imageId, Long memberId);
    Optional<SkinImageQuality> findBySkinImageId(Long imageId);
}
