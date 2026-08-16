package kr.deepsync.wellness.experiment.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DailyCheckRequest(@NotNull Boolean achieved, @Size(max = 500) String note) {
}
