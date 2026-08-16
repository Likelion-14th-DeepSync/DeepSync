package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.AnalysisConfidenceResult;

public record ConfidenceComponentsResponse(
        ConfidenceComponentResponse imageQuality,
        ConfidenceComponentResponse skinRecordCoverage,
        ConfidenceComponentResponse lifestyleCompleteness,
        ConfidenceComponentResponse environmentCompleteness,
        ConfidenceComponentResponse repeatedObservations,
        ConfidenceComponentResponse experimentEvidence,
        ConfidenceComponentResponse modelConfidence
) {
    public static ConfidenceComponentsResponse from(AnalysisConfidenceResult result, int periodDays) {
        return new ConfidenceComponentsResponse(
                new ConfidenceComponentResponse(result.getImageQualityScore(), result.isImageQualityAvailable(),
                        "최근 촬영 품질 점수"),
                new ConfidenceComponentResponse(result.getSkinRecordCoverageScore(), true,
                        "최근 %d일 중 %d일 피부 분석 기록".formatted(periodDays, result.getSkinRecordedDays())),
                new ConfidenceComponentResponse(result.getLifestyleCompletenessScore(), true,
                        "수면·취침·야식·수분 기록 완성도"),
                new ConfidenceComponentResponse(result.getEnvironmentCompletenessScore(), true,
                        "UV·기온·습도·미세먼지 기록 완성도"),
                new ConfidenceComponentResponse(result.getRepeatedObservationScore(),
                        result.isRepeatedObservationAvailable(), "개인별 영향 요인의 반복 관찰 균형"),
                new ConfidenceComponentResponse(result.getExperimentEvidenceScore(),
                        result.isExperimentEvidenceAvailable(), "완료된 생활 실험 결과 근거"),
                new ConfidenceComponentResponse(result.getModelConfidenceScore(),
                        result.isModelConfidenceAvailable(), "완료된 피부 분석의 평균 모델 신뢰도")
        );
    }
}
