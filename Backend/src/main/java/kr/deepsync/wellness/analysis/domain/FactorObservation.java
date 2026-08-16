package kr.deepsync.wellness.analysis.domain;

import java.time.LocalDate;

public record FactorObservation(
        LocalDate factorDate,
        boolean exposed,
        double skinScore,
        double modelConfidence
) {
}
