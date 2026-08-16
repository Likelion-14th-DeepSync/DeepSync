package kr.deepsync.wellness.analysis.repository;

import kr.deepsync.wellness.analysis.domain.FactorType;
import kr.deepsync.wellness.analysis.domain.PersonalFactorAnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PersonalFactorAnalysisResultRepository extends JpaRepository<PersonalFactorAnalysisResult, Long> {
    List<PersonalFactorAnalysisResult> findAllByMemberId(Long memberId);
    List<PersonalFactorAnalysisResult> findAllByMemberIdAndFactorType(Long memberId, FactorType factorType);
    void deleteAllByMemberId(Long memberId);
}
