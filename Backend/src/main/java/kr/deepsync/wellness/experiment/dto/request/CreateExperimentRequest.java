package kr.deepsync.wellness.experiment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import kr.deepsync.wellness.experiment.domain.ExperimentPeriod;
import kr.deepsync.wellness.experiment.domain.ExperimentType;
import java.time.LocalDate;

public record CreateExperimentRequest(@NotBlank @Size(max = 100) String title,
                                      @NotNull ExperimentType experimentType,
                                      @NotNull ExperimentPeriod experimentPeriod,
                                      @NotNull LocalDate startDate) {
}
