package kr.deepsync.wellness.analysis.repository;

import kr.deepsync.wellness.analysis.domain.AnalysisConfidenceResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnalysisConfidenceResultRepository extends JpaRepository<AnalysisConfidenceResult, Long> {
    Optional<AnalysisConfidenceResult> findByMemberId(Long memberId);
}
