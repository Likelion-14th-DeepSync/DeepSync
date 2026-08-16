package kr.deepsync.wellness.analysis.service;

import kr.deepsync.wellness.analysis.domain.TargetSkinMetric;

public record DailySkinScore(
        double redness,
        double trouble,
        double dryness,
        double toneUniformity,
        double overall,
        double modelConfidence
) {
    public double score(TargetSkinMetric metric) {
        return switch (metric) {
            case REDNESS -> redness;
            case TROUBLE -> trouble;
            case DRYNESS -> dryness;
            case TONE_UNIFORMITY -> toneUniformity;
            case OVERALL -> overall;
        };
    }
}
