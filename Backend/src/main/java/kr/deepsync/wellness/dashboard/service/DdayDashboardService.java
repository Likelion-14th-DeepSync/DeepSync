package kr.deepsync.wellness.dashboard.service;

import kr.deepsync.wellness.analysis.domain.AnalysisTimelinePeriod;
import kr.deepsync.wellness.analysis.dto.response.*;
import kr.deepsync.wellness.analysis.repository.AnalysisConfidenceResultRepository;
import kr.deepsync.wellness.analysis.repository.SkinAnalysisRepository;
import kr.deepsync.wellness.analysis.domain.SkinAnalysisStatus;
import kr.deepsync.wellness.analysis.service.DailySkinInsightService;
import kr.deepsync.wellness.analysis.service.SkinAnalysisComparisonService;
import kr.deepsync.wellness.dashboard.dto.response.*;
import kr.deepsync.wellness.dday.domain.GoalStatus;
import kr.deepsync.wellness.dday.dto.response.SkinGoalResponse;
import kr.deepsync.wellness.dday.repository.SkinGoalRepository;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.environment.dto.response.EnvironmentRecordResponse;
import kr.deepsync.wellness.environment.repository.EnvironmentRecordRepository;
import kr.deepsync.wellness.experiment.domain.ExperimentStatus;
import kr.deepsync.wellness.experiment.domain.LifestyleExperiment;
import kr.deepsync.wellness.experiment.dto.response.ExperimentProgressResponse;
import kr.deepsync.wellness.experiment.dto.response.ExperimentResponse;
import kr.deepsync.wellness.experiment.repository.LifestyleExperimentRepository;
import kr.deepsync.wellness.experiment.service.LifestyleExperimentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DdayDashboardService {
    private static final Set<ExperimentStatus> OPEN_EXPERIMENT_STATUSES =
            EnumSet.of(ExperimentStatus.SCHEDULED, ExperimentStatus.ACTIVE);

    private final SkinGoalRepository goalRepository;
    private final LifestyleExperimentRepository experimentRepository;
    private final LifestyleExperimentService experimentService;
    private final EnvironmentRecordRepository environmentRepository;
    private final DailySkinInsightService insightService;
    private final SkinAnalysisComparisonService comparisonService;
    private final AnalysisConfidenceResultRepository confidenceRepository;
    private final SkinAnalysisRepository skinAnalysisRepository;
    private final Clock clock;

    public DdayDashboardResponse get(Long memberId, AnalysisTimelinePeriod requestedPeriod) {
        AnalysisTimelinePeriod period = requestedPeriod == null
                ? AnalysisTimelinePeriod.THIRTY_DAYS : requestedPeriod;
        LocalDate today = LocalDate.now(clock);
        List<String> warnings = new ArrayList<>();

        SkinGoalResponse goal = goalRepository.findByMemberIdAndStatus(memberId, GoalStatus.ACTIVE)
                .map(value -> SkinGoalResponse.from(value, today))
                .orElseGet(() -> {
                    warnings.add("진행 중인 Skin D-Day 목표가 없습니다.");
                    return null;
                });
        DailySkinInsightResponse insight = skinInsight(memberId, today, warnings);
        DashboardExperimentResponse experiment = activeExperiment(memberId, warnings);
        DashboardEnvironmentResponse environment = environment(memberId, today, warnings);
        SkinAnalysisTimelineResponse timeline = comparisonService.getTimeline(memberId, period);
        AnalysisConfidenceResponse confidence = confidenceRepository.findByMemberId(memberId)
                .map(AnalysisConfidenceResponse::from)
                .orElseGet(() -> {
                    warnings.add("종합 분석 신뢰도가 아직 계산되지 않았습니다.");
                    return null;
                });
        return new DdayDashboardResponse(today, goal, insight, experiment, environment, timeline,
                confidence, DashboardRoutineResponse.notConnected(), warnings, LocalDateTime.now(clock));
    }

    private DailySkinInsightResponse skinInsight(Long memberId, LocalDate today, List<String> warnings) {
        boolean exists = skinAnalysisRepository
                .findAllBySkinImageMemberIdAndSkinImageCapturedAtGreaterThanEqualAndSkinImageCapturedAtLessThanOrderBySkinImageCapturedAtDesc(
                        memberId, today.atStartOfDay(), today.plusDays(1).atStartOfDay())
                .stream().anyMatch(value -> value.getStatus() == SkinAnalysisStatus.COMPLETED);
        if (!exists) {
            warnings.add("오늘 완료된 피부 분석이 없습니다.");
            return null;
        }
        return insightService.getToday(memberId);
    }

    private DashboardExperimentResponse activeExperiment(Long memberId, List<String> warnings) {
        Optional<LifestyleExperiment> optional = experimentRepository
                .findFirstByMemberIdAndStatusInOrderByCreatedAtDesc(memberId, OPEN_EXPERIMENT_STATUSES);
        if (optional.isEmpty()) {
            warnings.add("진행 중이거나 예정된 생활 실험이 없습니다.");
            return null;
        }
        LifestyleExperiment experiment = optional.get();
        ExperimentProgressResponse progress = experimentService.progress(memberId, experiment.getId());
        return new DashboardExperimentResponse(ExperimentResponse.from(experiment), progress);
    }

    private DashboardEnvironmentResponse environment(Long memberId, LocalDate today, List<String> warnings) {
        Optional<EnvironmentRecord> optional = environmentRepository.findByMemberIdAndRecordDate(memberId, today);
        if (optional.isEmpty()) {
            warnings.add("오늘 환경 기록이 없습니다.");
            return new DashboardEnvironmentResponse(false, null, List.of());
        }
        EnvironmentRecord record = optional.get();
        return new DashboardEnvironmentResponse(true, EnvironmentRecordResponse.from(record), risks(record));
    }

    private List<EnvironmentRiskResponse> risks(EnvironmentRecord record) {
        List<EnvironmentRiskResponse> risks = new ArrayList<>();
        if (record.getUvIndex() != null && record.getUvIndex().compareTo(BigDecimal.valueOf(6)) >= 0) {
            risks.add(new EnvironmentRiskResponse("HIGH_UV", record.getUvIndex().toPlainString(),
                    "오늘 UV 지수가 높습니다."));
        }
        if (record.getHumidity() != null && record.getHumidity() < 40) {
            risks.add(new EnvironmentRiskResponse("LOW_HUMIDITY", record.getHumidity() + "%",
                    "오늘 습도가 낮습니다."));
        }
        if (record.getFineDust() != null && record.getFineDust() >= 81) {
            risks.add(new EnvironmentRiskResponse("HIGH_FINE_DUST", record.getFineDust() + "㎍/㎥",
                    "오늘 미세먼지 농도가 높습니다."));
        }
        if (record.getTemperature() != null && record.getTemperature().compareTo(BigDecimal.valueOf(30)) >= 0) {
            risks.add(new EnvironmentRiskResponse("HIGH_TEMPERATURE", record.getTemperature() + "℃",
                    "오늘 기온이 높습니다."));
        } else if (record.getTemperature() != null
                && record.getTemperature().compareTo(BigDecimal.valueOf(10)) <= 0) {
            risks.add(new EnvironmentRiskResponse("LOW_TEMPERATURE", record.getTemperature() + "℃",
                    "오늘 기온이 낮습니다."));
        }
        return risks;
    }
}
