package kr.deepsync.wellness.experiment.service;

import kr.deepsync.wellness.experiment.domain.CheckSourceType;
import kr.deepsync.wellness.experiment.domain.ExperimentDailyCheck;
import kr.deepsync.wellness.experiment.domain.ExperimentStatus;
import kr.deepsync.wellness.experiment.domain.ExperimentType;
import kr.deepsync.wellness.experiment.domain.LifestyleExperiment;
import kr.deepsync.wellness.experiment.repository.ExperimentDailyCheckRepository;
import kr.deepsync.wellness.experiment.repository.LifestyleExperimentRepository;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ExperimentAutoSyncService {
    private static final Set<ExperimentStatus> OPEN_STATUSES =
            EnumSet.of(ExperimentStatus.SCHEDULED, ExperimentStatus.ACTIVE);

    private final LifestyleExperimentRepository experimentRepository;
    private final ExperimentDailyCheckRepository checkRepository;
    private final ExperimentAchievementEvaluator evaluator;
    private final Clock clock;

    @Transactional
    public void syncLifestyleRecord(LifestyleRecord record) {
        experimentRepository.findFirstByMemberIdAndStatusInOrderByCreatedAtDesc(
                        record.getMember().getId(), OPEN_STATUSES)
                .ifPresent(experiment -> syncIfApplicable(experiment, record, false));
    }

    @Transactional
    public void syncRecord(LifestyleExperiment experiment, LifestyleRecord record) {
        syncIfApplicable(experiment, record, true);
    }

    private void syncIfApplicable(LifestyleExperiment experiment, LifestyleRecord record, boolean allowEnded) {
        LocalDate today = LocalDate.now(clock);
        experiment.activateIfStarted(today);
        if (experiment.getStatus() != ExperimentStatus.ACTIVE
                || !experiment.contains(record.getRecordDate())
                || record.getRecordDate().isAfter(today)
                || (!allowEnded && today.isAfter(experiment.getEndDate()))
                || experiment.getExperimentType() == ExperimentType.KEEP_SUNSCREEN_ROUTINE) {
            return;
        }

        Optional<ExperimentEvaluation> evaluation = evaluator.evaluate(experiment.getExperimentType(), record);
        Optional<ExperimentDailyCheck> existing = checkRepository
                .findByExperimentIdAndRecordDate(experiment.getId(), record.getRecordDate());
        if (evaluation.isEmpty()) {
            existing.filter(check -> check.getSourceType() == CheckSourceType.AUTO)
                    .ifPresent(checkRepository::delete);
            return;
        }

        ExperimentEvaluation result = evaluation.get();
        ExperimentDailyCheck check = existing.orElseGet(() -> ExperimentDailyCheck.create(
                experiment, record.getRecordDate(), result.achieved(), result.actualValue(),
                CheckSourceType.AUTO, null));
        check.update(result.achieved(), result.actualValue(), CheckSourceType.AUTO, null);
        checkRepository.save(check);
    }
}
