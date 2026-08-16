package kr.deepsync.wellness.analysis.repository;

import kr.deepsync.wellness.analysis.domain.SkinAnalysisBaseline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SkinAnalysisBaselineRepository extends JpaRepository<SkinAnalysisBaseline, Long> {
    Optional<SkinAnalysisBaseline> findByMemberId(Long memberId);
}
