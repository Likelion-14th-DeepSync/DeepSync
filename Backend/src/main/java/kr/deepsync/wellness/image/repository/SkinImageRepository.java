package kr.deepsync.wellness.image.repository;

import kr.deepsync.wellness.image.domain.SkinImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SkinImageRepository extends JpaRepository<SkinImage, Long> {
    Optional<SkinImage> findByIdAndMemberId(Long id, Long memberId);

    List<SkinImage> findAllByMemberIdAndCapturedAtGreaterThanEqualAndCapturedAtLessThanOrderByCapturedAtDesc(
            Long memberId, LocalDateTime startInclusive, LocalDateTime endExclusive);
}
