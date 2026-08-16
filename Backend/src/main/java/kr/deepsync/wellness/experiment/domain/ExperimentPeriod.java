package kr.deepsync.wellness.experiment.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ExperimentPeriod {
    SEVEN_DAYS(7),
    THIRTY_DAYS(30),
    NINETY_DAYS(90);

    private final int days;
}
