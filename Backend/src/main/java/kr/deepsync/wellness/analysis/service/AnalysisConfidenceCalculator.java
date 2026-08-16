package kr.deepsync.wellness.analysis.service;

import kr.deepsync.wellness.analysis.domain.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class AnalysisConfidenceCalculator {
    public AnalysisConfidenceCalculation calculate(AnalysisConfidenceEvidence evidence,
                                                   LocalDateTime calculatedAt) {
        int weightedSum = 0;
        int weightSum = 0;
        if (evidence.imageQualityAvailable()) {
            weightedSum += evidence.imageQualityScore() * 20;
            weightSum += 20;
        }
        weightedSum += evidence.skinRecordCoverageScore() * 20;
        weightedSum += evidence.lifestyleCompletenessScore() * 15;
        weightedSum += evidence.environmentCompletenessScore() * 10;
        weightSum += 45;
        if (evidence.repeatedObservationAvailable()) {
            weightedSum += evidence.repeatedObservationScore() * 15;
            weightSum += 15;
        }
        if (evidence.experimentEvidenceAvailable()) {
            weightedSum += evidence.experimentEvidenceScore() * 10;
            weightSum += 10;
        }
        if (evidence.modelConfidenceAvailable()) {
            weightedSum += evidence.modelConfidenceScore() * 10;
            weightSum += 10;
        }
        int score = weightSum == 0 ? 0 : (int) Math.round((double) weightedSum / weightSum);
        score = applyCaps(score, evidence);
        AnalysisConfidenceLevel level = score >= 80 ? AnalysisConfidenceLevel.HIGH
                : score >= 50 ? AnalysisConfidenceLevel.MEDIUM : AnalysisConfidenceLevel.LOW;
        return new AnalysisConfidenceCalculation(score, level, reasons(evidence),
                nextActions(evidence), calculatedAt);
    }

    private int applyCaps(int score, AnalysisConfidenceEvidence evidence) {
        if (evidence.skinRecordedDays() < 3) return Math.min(score, 49);
        if (evidence.skinRecordedDays() < 7) score = Math.min(score, 79);
        if (!evidence.modelConfidenceAvailable() || evidence.modelConfidenceScore() < 60) {
            score = Math.min(score, 79);
        }
        if (!evidence.repeatedObservationAvailable()) score = Math.min(score, 79);
        return score;
    }

    private List<String> reasons(AnalysisConfidenceEvidence evidence) {
        List<String> reasons = new ArrayList<>();
        reasons.add("최근 %d일 중 피부 분석이 %d일 기록됐습니다."
                .formatted(evidence.periodDays(), evidence.skinRecordedDays()));
        if (!evidence.imageQualityAvailable()) reasons.add("분석 가능한 촬영 품질 기록이 없습니다.");
        if (evidence.lifestyleCompletenessScore() < 80) reasons.add("생활 기록의 일부 항목이 누락되어 있습니다.");
        if (evidence.environmentCompletenessScore() < 80) reasons.add("환경 기록의 일부 항목이 누락되어 있습니다.");
        if (!evidence.repeatedObservationAvailable()) reasons.add("비교 가능한 개인별 영향 요인이 아직 없습니다.");
        if (!evidence.experimentEvidenceAvailable()) reasons.add("완료된 생활 실험 결과가 아직 없습니다.");
        if (!evidence.modelConfidenceAvailable()) reasons.add("완료된 피부 분석의 모델 신뢰도가 없습니다.");
        return reasons;
    }

    private List<String> nextActions(AnalysisConfidenceEvidence evidence) {
        List<String> actions = new ArrayList<>();
        if (evidence.skinRecordedDays() < 7) actions.add("피부 분석 기록을 최소 7일까지 쌓아주세요.");
        if (evidence.lifestyleCompletenessScore() < 80) actions.add("수면·야식·수분 섭취 기록을 빠짐없이 작성해 주세요.");
        if (evidence.environmentCompletenessScore() < 80) actions.add("UV·기온·습도·미세먼지 기록을 채워주세요.");
        if (!evidence.repeatedObservationAvailable()) actions.add("서로 다른 생활 조건에서 기록을 반복해 주세요.");
        if (!evidence.experimentEvidenceAvailable()) actions.add("생활 실험을 완료하면 신뢰도를 높일 수 있습니다.");
        if (actions.isEmpty()) actions.add("현재 기록 습관을 꾸준히 유지해 주세요.");
        return actions;
    }
}
