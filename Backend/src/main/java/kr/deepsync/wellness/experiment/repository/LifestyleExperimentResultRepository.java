package kr.deepsync.wellness.experiment.repository;

import kr.deepsync.wellness.experiment.domain.LifestyleExperimentResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface LifestyleExperimentResultRepository extends JpaRepository<LifestyleExperimentResult, Long> {
    Optional<LifestyleExperimentResult> findByExperimentIdAndExperimentMemberId(Long experimentId, Long memberId);
    boolean existsByExperimentId(Long experimentId);
    List<LifestyleExperimentResult> findAllByExperimentMemberId(Long memberId);
}
