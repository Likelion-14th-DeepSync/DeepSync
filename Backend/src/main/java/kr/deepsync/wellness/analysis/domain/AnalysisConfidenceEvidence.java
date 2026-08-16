package kr.deepsync.wellness.analysis.domain;

import java.time.LocalDate;

public record AnalysisConfidenceEvidence(
        int periodDays,
        int imageQualityScore,
        boolean imageQualityAvailable,
        int skinRecordCoverageScore,
        int lifestyleCompletenessScore,
        int environmentCompletenessScore,
        int repeatedObservationScore,
        boolean repeatedObservationAvailable,
        int experimentEvidenceScore,
        boolean experimentEvidenceAvailable,
        int modelConfidenceScore,
        boolean modelConfidenceAvailable,
        int skinRecordedDays,
        LocalDate analyzedFrom,
        LocalDate analyzedTo
) {
}
