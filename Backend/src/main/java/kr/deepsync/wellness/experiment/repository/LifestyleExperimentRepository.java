package kr.deepsync.wellness.experiment.repository;

import kr.deepsync.wellness.experiment.domain.ExperimentStatus;
import kr.deepsync.wellness.experiment.domain.LifestyleExperiment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LifestyleExperimentRepository extends JpaRepository<LifestyleExperiment, Long> {
    boolean existsByMemberIdAndStatusIn(Long memberId, Collection<ExperimentStatus> statuses);
    Optional<LifestyleExperiment> findFirstByMemberIdAndStatusInOrderByCreatedAtDesc(
            Long memberId, Collection<ExperimentStatus> statuses);
    Optional<LifestyleExperiment> findByIdAndMemberId(Long id, Long memberId);
    List<LifestyleExperiment> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);
}
