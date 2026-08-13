package kr.deepsync.wellness.environment.repository;

import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EnvironmentRecordRepository extends JpaRepository<EnvironmentRecord, Long> {
    boolean existsByMemberIdAndRecordDate(Long memberId, LocalDate recordDate);
    Optional<EnvironmentRecord> findByMemberIdAndRecordDate(Long memberId, LocalDate recordDate);
    List<EnvironmentRecord> findAllByMemberIdAndRecordDateBetweenOrderByRecordDateAsc(
            Long memberId, LocalDate startDate, LocalDate endDate);
}
