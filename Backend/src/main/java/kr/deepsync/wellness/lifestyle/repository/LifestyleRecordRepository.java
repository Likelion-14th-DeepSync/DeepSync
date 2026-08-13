package kr.deepsync.wellness.lifestyle.repository;

import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LifestyleRecordRepository extends JpaRepository<LifestyleRecord, Long> {
    boolean existsByMemberIdAndRecordDate(Long memberId, LocalDate recordDate);
    Optional<LifestyleRecord> findByMemberIdAndRecordDate(Long memberId, LocalDate recordDate);
    List<LifestyleRecord> findAllByMemberIdAndRecordDateBetweenOrderByRecordDateAsc(
            Long memberId, LocalDate startDate, LocalDate endDate);
}
