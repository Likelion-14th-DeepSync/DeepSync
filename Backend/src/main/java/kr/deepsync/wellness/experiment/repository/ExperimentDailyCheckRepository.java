package kr.deepsync.wellness.experiment.repository;

import kr.deepsync.wellness.experiment.domain.ExperimentDailyCheck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExperimentDailyCheckRepository extends JpaRepository<ExperimentDailyCheck, Long> {
    Optional<ExperimentDailyCheck> findByExperimentIdAndRecordDate(Long experimentId, LocalDate date);
    List<ExperimentDailyCheck> findAllByExperimentIdOrderByRecordDateAsc(Long experimentId);
}
