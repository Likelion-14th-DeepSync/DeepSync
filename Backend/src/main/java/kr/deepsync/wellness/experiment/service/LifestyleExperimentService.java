package kr.deepsync.wellness.experiment.service;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.experiment.domain.*;
import kr.deepsync.wellness.experiment.dto.request.*;
import kr.deepsync.wellness.experiment.dto.response.*;
import kr.deepsync.wellness.experiment.exception.ExperimentNotFoundException;
import kr.deepsync.wellness.experiment.repository.*;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import kr.deepsync.wellness.lifestyle.repository.LifestyleRecordRepository;
import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.exception.MemberNotFoundException;
import kr.deepsync.wellness.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LifestyleExperimentService {
    private static final Set<ExperimentStatus> OPEN_STATUSES =
            EnumSet.of(ExperimentStatus.SCHEDULED, ExperimentStatus.ACTIVE);
    private final LifestyleExperimentRepository experimentRepository;
    private final ExperimentDailyCheckRepository checkRepository;
    private final LifestyleRecordRepository lifestyleRepository;
    private final MemberRepository memberRepository;
    private final Clock clock;
    private final ExperimentAutoSyncService autoSyncService;

    @Transactional
    public ExperimentResponse create(Long memberId, CreateExperimentRequest request) {
        LocalDate today = LocalDate.now(clock);
        if (request.startDate().isBefore(today)) {
            throw new BusinessException(ErrorCode.INVALID_EXPERIMENT_START_DATE);
        }
        if (experimentRepository.existsByMemberIdAndStatusIn(memberId, OPEN_STATUSES)) {
            throw new BusinessException(ErrorCode.OPEN_EXPERIMENT_EXISTS);
        }
        Member member = memberRepository.findById(memberId).orElseThrow(MemberNotFoundException::new);
        return ExperimentResponse.from(experimentRepository.save(LifestyleExperiment.create(member,
                request.title(), request.experimentType(), request.experimentPeriod(), request.startDate(), today)));
    }

    @Transactional
    public ExperimentResponse getOpen(Long memberId) {
        LifestyleExperiment experiment = experimentRepository
                .findFirstByMemberIdAndStatusInOrderByCreatedAtDesc(memberId, OPEN_STATUSES)
                .orElseThrow(ExperimentNotFoundException::new);
        experiment.activateIfStarted(LocalDate.now(clock));
        return ExperimentResponse.from(experiment);
    }

    @Transactional
    public ExperimentResponse get(Long memberId, Long experimentId) {
        LifestyleExperiment experiment = find(memberId, experimentId);
        experiment.activateIfStarted(LocalDate.now(clock));
        return ExperimentResponse.from(experiment);
    }

    public List<ExperimentResponse> getHistory(Long memberId) {
        return experimentRepository.findAllByMemberIdOrderByCreatedAtDesc(memberId).stream()
                .map(ExperimentResponse::from).toList();
    }

    @Transactional
    public ExperimentResponse cancel(Long memberId, Long experimentId) {
        LifestyleExperiment experiment = find(memberId, experimentId);
        experiment.cancel();
        return ExperimentResponse.from(experiment);
    }

    @Transactional
    public ExperimentResponse complete(Long memberId, Long experimentId) {
        LifestyleExperiment experiment = find(memberId, experimentId);
        experiment.complete(LocalDate.now(clock), LocalDateTime.now(clock));
        return ExperimentResponse.from(experiment);
    }

    @Transactional
    public DailyCheckResponse putManualCheck(Long memberId, Long experimentId, LocalDate date,
                                             DailyCheckRequest request) {
        LifestyleExperiment experiment = editableExperiment(memberId, experimentId, date);
        if (experiment.getExperimentType() != ExperimentType.KEEP_SUNSCREEN_ROUTINE) {
            throw new BusinessException(ErrorCode.MANUAL_CHECK_NOT_ALLOWED);
        }
        ExperimentDailyCheck check = checkRepository.findByExperimentIdAndRecordDate(experimentId, date)
                .orElseGet(() -> ExperimentDailyCheck.create(experiment, date, request.achieved(),
                        null, CheckSourceType.MANUAL, request.note()));
        check.update(request.achieved(), null, CheckSourceType.MANUAL, request.note());
        return DailyCheckResponse.from(checkRepository.save(check));
    }

    @Transactional
    public List<DailyCheckResponse> sync(Long memberId, Long experimentId) {
        LifestyleExperiment experiment = find(memberId, experimentId);
        experiment.validateEditable();
        if (experiment.getExperimentType() == ExperimentType.KEEP_SUNSCREEN_ROUTINE) {
            throw new BusinessException(ErrorCode.MANUAL_CHECK_REQUIRED);
        }
        LocalDate today = LocalDate.now(clock);
        LocalDate syncEnd = today.isBefore(experiment.getEndDate()) ? today : experiment.getEndDate();
        if (syncEnd.isBefore(experiment.getStartDate())) return List.of();
        List<LifestyleRecord> records = lifestyleRepository
                .findAllByMemberIdAndRecordDateBetweenOrderByRecordDateAsc(memberId, experiment.getStartDate(), syncEnd);
        for (LifestyleRecord record : records) autoSyncService.syncRecord(experiment, record);
        return checkRepository.findAllByExperimentIdOrderByRecordDateAsc(experimentId).stream()
                .map(DailyCheckResponse::from).toList();
    }

    @Transactional
    public ExperimentProgressResponse progress(Long memberId, Long experimentId) {
        LifestyleExperiment experiment = find(memberId, experimentId);
        experiment.activateIfStarted(LocalDate.now(clock));
        List<DailyCheckResponse> checks = checkRepository.findAllByExperimentIdOrderByRecordDateAsc(experimentId)
                .stream().map(DailyCheckResponse::from).toList();
        int achieved = (int) checks.stream().filter(DailyCheckResponse::achieved).count();
        int recorded = checks.size();
        int elapsed = elapsedDays(experiment, LocalDate.now(clock));
        int currentDay = elapsed == 0 ? 0 : Math.min(elapsed, experiment.getExperimentPeriod().getDays());
        int remaining = Math.max(0, experiment.getExperimentPeriod().getDays() - currentDay);
        int missing = Math.max(0, currentDay - recorded);
        double rate = currentDay == 0 ? 0.0 : Math.round(achieved * 1000.0 / currentDay) / 10.0;
        return new ExperimentProgressResponse(experiment.getId(), experiment.getStatus(),
                experiment.getExperimentPeriod().getDays(), currentDay, remaining, recorded, achieved, missing,
                rate, checks);
    }

    @Transactional
    public ExperimentProgressSummaryResponse progressSummary(Long memberId, Long experimentId) {
        LifestyleExperiment experiment = find(memberId, experimentId);
        LocalDate today = LocalDate.now(clock);
        experiment.activateIfStarted(today);
        LocalDate summaryDate = summaryDate(experiment, today);
        List<ExperimentDailyCheck> checks = checkRepository
                .findAllByExperimentIdOrderByRecordDateAsc(experimentId);
        int elapsed = elapsedDays(experiment, summaryDate);
        ProgressTotalsResponse overall = totals(checks, experiment.getStartDate(),
                effectiveEnd(experiment, summaryDate), elapsed);
        List<ProgressSegmentResponse> weekly = segments(experiment, checks, summaryDate, 7);
        List<ProgressSegmentResponse> monthly = experiment.getExperimentPeriod() == ExperimentPeriod.NINETY_DAYS
                ? segments(experiment, checks, summaryDate, 30)
                : List.of();
        return new ExperimentProgressSummaryResponse(experiment.getId(), experiment.getStatus(),
                experiment.getExperimentPeriod(), experiment.getExperimentPeriod().getDays(), overall,
                weekly, monthly);
    }

    private List<ProgressSegmentResponse> segments(LifestyleExperiment experiment,
                                                    List<ExperimentDailyCheck> checks,
                                                    LocalDate today,
                                                    int segmentDays) {
        List<ProgressSegmentResponse> summaries = new ArrayList<>();
        LocalDate segmentStart = experiment.getStartDate();
        int sequence = 1;
        while (!segmentStart.isAfter(experiment.getEndDate())) {
            LocalDate segmentEnd = segmentStart.plusDays(segmentDays - 1L);
            if (segmentEnd.isAfter(experiment.getEndDate())) segmentEnd = experiment.getEndDate();
            int planned = (int) ChronoUnit.DAYS.between(segmentStart, segmentEnd) + 1;
            int elapsed = elapsedDays(segmentStart, segmentEnd, today);
            ProgressTotalsResponse totals = totals(checks, segmentStart,
                    elapsed == 0 ? segmentStart.minusDays(1) : min(segmentEnd, today), elapsed);
            summaries.add(new ProgressSegmentResponse(sequence, segmentStart, segmentEnd, planned,
                    totals.elapsedDays(), totals.recordedDays(), totals.achievedDays(), totals.missingDays(),
                    totals.completionRate()));
            segmentStart = segmentEnd.plusDays(1);
            sequence++;
        }
        return summaries;
    }

    private ProgressTotalsResponse totals(List<ExperimentDailyCheck> checks, LocalDate start,
                                           LocalDate effectiveEnd, int elapsed) {
        if (elapsed == 0) return new ProgressTotalsResponse(0, 0, 0, 0, 0.0);
        List<ExperimentDailyCheck> included = checks.stream()
                .filter(check -> !check.getRecordDate().isBefore(start)
                        && !check.getRecordDate().isAfter(effectiveEnd))
                .toList();
        int recorded = included.size();
        int achieved = (int) included.stream().filter(ExperimentDailyCheck::isAchieved).count();
        int missing = Math.max(0, elapsed - recorded);
        double rate = Math.round(achieved * 1000.0 / elapsed) / 10.0;
        return new ProgressTotalsResponse(elapsed, recorded, achieved, missing, rate);
    }

    private int elapsedDays(LocalDate start, LocalDate end, LocalDate today) {
        if (today.isBefore(start)) return 0;
        LocalDate effective = min(end, today);
        return (int) ChronoUnit.DAYS.between(start, effective) + 1;
    }

    private LocalDate effectiveEnd(LifestyleExperiment experiment, LocalDate today) {
        if (today.isBefore(experiment.getStartDate())) return experiment.getStartDate().minusDays(1);
        return min(experiment.getEndDate(), today);
    }

    private LocalDate min(LocalDate first, LocalDate second) {
        return first.isBefore(second) ? first : second;
    }

    private LocalDate summaryDate(LifestyleExperiment experiment, LocalDate today) {
        if (experiment.getStatus() == ExperimentStatus.CANCELLED && experiment.getUpdatedAt() != null) {
            return min(today, experiment.getUpdatedAt().toLocalDate());
        }
        return today;
    }


    private LifestyleExperiment editableExperiment(Long memberId, Long experimentId, LocalDate date) {
        LifestyleExperiment experiment = find(memberId, experimentId);
        experiment.activateIfStarted(LocalDate.now(clock));
        experiment.validateEditable();
        if (!experiment.contains(date)) throw new BusinessException(ErrorCode.EXPERIMENT_DATE_OUT_OF_RANGE);
        if (date.isAfter(LocalDate.now(clock))) throw new BusinessException(ErrorCode.FUTURE_EXPERIMENT_CHECK);
        return experiment;
    }

    private LifestyleExperiment find(Long memberId, Long experimentId) {
        return experimentRepository.findByIdAndMemberId(experimentId, memberId)
                .orElseThrow(ExperimentNotFoundException::new);
    }

    private int elapsedDays(LifestyleExperiment experiment, LocalDate today) {
        if (today.isBefore(experiment.getStartDate())) return 0;
        LocalDate effective = today.isAfter(experiment.getEndDate()) ? experiment.getEndDate() : today;
        return (int) ChronoUnit.DAYS.between(experiment.getStartDate(), effective) + 1;
    }

}
